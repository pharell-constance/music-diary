const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const {
    getSpotifyToken,
    getArtistGenres,
    getArtistStats,
    getValidUserAccessToken
} = require('../services/spotifyService');

// Route pour obtenir les détails d'un artiste
router.get('/artists/:artistId/details', authenticateToken, async (req, res) => {
    try {
        const artistId = req.params.artistId;
        const clientToken = await getSpotifyToken();

        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });

        if (!artistResponse.ok) {
            const userWithFav = await prisma.user.findFirst({
                where: { favArtistId: artistId }
            });
            if (userWithFav) {
                return res.json({
                    id: artistId,
                    name: userWithFav.favArtistName,
                    images: userWithFav.favArtistImage ? [{ url: userWithFav.favArtistImage }] : [],
                    followers: 0,
                    popularity: 50,
                    monthlyListeners: 0,
                    genres: [],
                    topTracks: []
                });
            }
            return res.status(artistResponse.status).json({ error: "Impossible de récupérer les détails de l'artiste depuis Spotify (Erreur 429 Rate Limit)" });
        }
        const artistData = await artistResponse.json();

        let topTracks = [];
        const userToken = await getValidUserAccessToken(req.user.userId);
        if (userToken) {
            const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=FR`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (tracksResponse.ok) {
                const tracksData = await tracksResponse.json();
                topTracks = (tracksData.tracks || []).slice(0, 10).map(track => ({
                    id: track.id,
                    name: track.name,
                    albumName: track.album?.name || "",
                    albumCover: track.album?.images?.[0]?.url || "",
                    durationMs: track.duration_ms,
                    previewUrl: track.preview_url
                }));
            }
        }

        if (topTracks.length === 0) {
            const artistName = encodeURIComponent(artistData.name);
            const searchRes = await fetch(
                `https://api.spotify.com/v1/search?q=artist:${artistName}&type=track&market=FR&limit=10`,
                { headers: { 'Authorization': `Bearer ${clientToken}` } }
            );
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                const filtered = (searchData.tracks?.items || [])
                    .filter(t => t.artists?.some(a => a.id === artistId))
                    .slice(0, 10);
                topTracks = filtered.map(track => ({
                    id: track.id,
                    name: track.name,
                    albumName: track.album?.name || "",
                    albumCover: track.album?.images?.[0]?.url || "",
                    durationMs: track.duration_ms,
                    previewUrl: track.preview_url
                }));
            }
        }

        const genres = getArtistGenres(artistData);
        const stats = getArtistStats(artistData.name);

        res.json({
            id: artistData.id,
            name: artistData.name,
            images: artistData.images || [],
            followers: stats.followers,
            popularity: stats.popularity,
            monthlyListeners: stats.monthlyListeners,
            genres: genres,
            topTracks: topTracks
        });

    } catch (error) {
        console.error("Erreur détails artiste:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des détails de l'artiste" });
    }
});

// Routes pour les chansons / morceaux (détails)
router.get('/songs/:trackId/details', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.params;
        const clientToken = await getSpotifyToken();

        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });

        if (!response.ok) {
            const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${trackId}`, {
                headers: { 'Authorization': `Bearer ${clientToken}` }
            });
            if (albumResponse.ok) {
                const albumData = await albumResponse.json();
                return res.json({
                    id: albumData.id,
                    name: albumData.name,
                    isAlbum: true,
                    album: {
                        id: albumData.id,
                        name: albumData.name,
                        cover: albumData.images?.[0]?.url || "",
                        releaseDate: albumData.release_date
                    },
                    artists: albumData.artists?.map(art => ({
                        id: art.id,
                        name: art.name
                    })) || [],
                    tracks: albumData.tracks?.items?.map(t => ({
                        id: t.id,
                        name: t.name,
                        durationMs: t.duration_ms,
                        previewUrl: t.preview_url
                    })) || []
                });
            }

            const localReview = await prisma.review.findFirst({
                where: { spotifyAlbumId: trackId }
            });
            if (localReview) {
                return res.json({
                    id: trackId,
                    name: localReview.albumName,
                    durationMs: 0,
                    previewUrl: null,
                    isAlbum: false,
                    album: {
                        id: trackId,
                        name: localReview.albumName,
                        cover: localReview.albumCover,
                        releaseDate: null
                    },
                    artists: [{
                        id: "",
                        name: localReview.artistName
                    }]
                });
            }

            return res.status(response.status).json({ error: "Impossible de récupérer les détails depuis Spotify (erreur rate limit 429)" });
        }

        const data = await response.json();

        res.json({
            id: data.id,
            name: data.name,
            durationMs: data.duration_ms,
            previewUrl: data.preview_url,
            isAlbum: false,
            album: {
                id: data.album?.id,
                name: data.album?.name,
                cover: data.album?.images?.[0]?.url || "",
                releaseDate: data.album?.release_date
            },
            artists: data.artists?.map(art => ({
                id: art.id,
                name: art.name
            })) || []
        });
    } catch (error) {
        console.error("Erreur détails chanson/album:", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des détails" });
    }
});

// Route pour les paroles (lyrics)
router.get('/songs/:trackId/lyrics', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.params;
        let artistName = req.query.artistName;
        let trackName = req.query.trackName;
        let trackData = null;

        if (!artistName || !trackName) {
            const clientToken = await getSpotifyToken();

            const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': `Bearer ${clientToken}` }
            });

            if (trackRes.ok) {
                trackData = await trackRes.json();
                artistName = trackData.artists?.[0]?.name;
                trackName = trackData.name;
            } else {
                const localReview = await prisma.review.findFirst({
                    where: { spotifyAlbumId: trackId }
                });
                if (localReview) {
                    artistName = localReview.artistName;
                    trackName = localReview.albumName;
                } else {
                    return res.status(trackRes.status).json({ error: "Impossible de récupérer le morceau sur Spotify (Erreur 429)" });
                }
            }
        }

        if (!artistName || !trackName) {
            return res.status(400).json({ error: "Informations de morceau incomplètes" });
        }

        const cleanName = (name) => {
            return name
                .replace(/\s*-\s*.*$/, '')
                .replace(/\s*\(feat\..*?\)/i, '')
                .replace(/\s*\(with.*?\)/i, '')
                .replace(/\s*\(Radio Edit\)/i, '')
                .replace(/\s*\(Remastered\)/i, '')
                .trim();
        };

        const cleanedTrackName = cleanName(trackName);

        const lyricsUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(cleanedTrackName)}`;
        const lyricsRes = await fetch(lyricsUrl);
        let lyricsData = null;

        if (lyricsRes.ok) {
            lyricsData = await lyricsRes.json();
        } else {
            const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artistName} ${cleanedTrackName}`)}`;
            const searchRes = await fetch(searchUrl);
            if (searchRes.ok) {
                const searchResults = await searchRes.json();
                const matches = searchResults.filter(item => item.plainLyrics || item.syncedLyrics);

                if (matches.length > 0 && trackData) {
                    const spotifyDurationSec = trackData.duration_ms / 1000;
                    lyricsData = matches.reduce((prev, curr) => {
                        return Math.abs(curr.duration - spotifyDurationSec) < Math.abs(prev.duration - spotifyDurationSec) ? curr : prev;
                    });
                } else if (matches.length > 0) {
                    lyricsData = matches[0];
                }
            }
        }

        if (!lyricsData) {
            return res.json({ lyrics: null, syncedLyrics: null, instrumental: false });
        }

        res.json({
            lyrics: lyricsData.plainLyrics || null,
            syncedLyrics: lyricsData.syncedLyrics || null,
            instrumental: lyricsData.instrumental || false
        });
    } catch (error) {
        console.error("Erreur paroles chanson:", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des paroles" });
    }
});

// Route pour récupérer les critiques d'une chanson
router.get('/songs/:trackId/reviews', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { spotifyAlbumId: trackId },
            include: {
                author: {
                    select: {
                        id: true,
                        pseudo: true,
                        avatar: true,
                        role: true
                    }
                },
                likes: true,
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                pseudo: true,
                                avatar: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        console.error("Erreur récupération critiques chanson:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des avis" });
    }
});

// --- LYRIC PINS ROUTES ---

// GET — pins de l'utilisateur connecté
router.get('/lyric-pins', authenticateToken, async (req, res) => {
    try {
        const pins = await prisma.lyricPin.findMany({
            where: { authorId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pins);
    } catch (err) {
        console.error('Erreur lyric-pins GET:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET — pins d'un autre utilisateur
router.get('/users/:userId/lyric-pins', authenticateToken, async (req, res) => {
    try {
        const pins = await prisma.lyricPin.findMany({
            where: { authorId: parseInt(req.params.userId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pins);
    } catch (err) {
        console.error('Erreur lyric-pins GET user:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST — créer un pin
router.post('/lyric-pins', authenticateToken, async (req, res) => {
    try {
        const { lyric, trackName, artistName, albumCover, color } = req.body;
        if (!lyric || !trackName || !artistName) {
            return res.status(400).json({ error: 'Paroles, titre et artiste sont requis.' });
        }
        const pin = await prisma.lyricPin.create({
            data: {
                lyric,
                trackName,
                artistName,
                albumCover: albumCover || null,
                color: color || '#1DB954',
                authorId: req.user.userId
            }
        });
        res.status(201).json(pin);
    } catch (err) {
        console.error('Erreur lyric-pins POST:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE — supprimer un pin
router.delete('/lyric-pins/:id', authenticateToken, async (req, res) => {
    try {
        const pin = await prisma.lyricPin.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!pin) return res.status(404).json({ error: 'Pin non trouvé.' });
        if (pin.authorId !== req.user.userId) return res.status(403).json({ error: 'Interdit.' });
        await prisma.lyricPin.delete({ where: { id: pin.id } });
        res.json({ message: 'Pin supprimé.' });
    } catch (err) {
        console.error('Erreur lyric-pins DELETE:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
