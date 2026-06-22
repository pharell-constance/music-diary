const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const { getSpotifyToken, getValidUserAccessToken } = require('../services/spotifyAuthService');
const { getWeeklyTopTracks, getArtistGenres } = require('../services/spotifyDataService');

router.get('/users/:userId/reviews', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const reviews = await prisma.review.findMany({
            where: { authorId: targetUserId },
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

        const reviewsToFetch = reviews.filter(r => !r.albumName || !r.albumCover);
        if (reviewsToFetch.length > 0) {
            try {
                const token = await getSpotifyToken();
                await Promise.all(reviewsToFetch.map(async (review) => {
                    try {
                        const spotifyResponse = await fetch(`https://api.spotify.com/v1/albums/${review.spotifyAlbumId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (spotifyResponse.ok) {
                            const album = await spotifyResponse.json();
                            const name = album.name || "";
                            const cover = album.images?.[0]?.url || "";
                            const artists = album.artists.map(a => a.name).join(', ') || "";

                            review.albumName = name;
                            review.albumCover = cover;
                            review.artistName = artists;

                            await prisma.review.update({
                                where: { id: review.id },
                                data: { albumName: name, albumCover: cover, artistName: artists }
                            });
                        }
                    } catch (err) {
                        console.error(`Erreur Spotify fallback public album ${review.spotifyAlbumId}:`, err);
                    }
                }));
            } catch (err) {
                console.error("Erreur récupération token Spotify pour public fallback:", err);
            }
        }
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des critiques" });
    }
});

router.get('/users/:userId/spotify/recent', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur recent plays target:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des dernières lectures' });
    }
});

router.get('/users/:userId/spotify/weekly-top', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const tracks = await getWeeklyTopTracks(accessToken);
        res.json(tracks);
    } catch (err) {
        console.error('Erreur weekly-top target:', err);
        res.status(500).json({ error: err.message || 'Erreur lors de la génération du top hebdomadaire' });
    }
});

router.get('/users/:userId/spotify/top-artists', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur top artists target:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top artists' });
    }
});

router.get('/users/:userId/spotify/top-tracks', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur top tracks target:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top tracks' });
    }
});

router.get('/users/:userId/spotify/top-albums', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        const tracks = data.items || [];

        const albumMap = {};
        tracks.forEach(track => {
            if (track.album && track.album.album_type === 'album') {
                const albumId = track.album.id;
                if (!albumMap[albumId]) {
                    albumMap[albumId] = {
                        id: albumId,
                        name: track.album.name,
                        images: track.album.images,
                        artists: track.album.artists,
                        count: 0
                    };
                }
                albumMap[albumId].count += 1;
            }
        });

        const sortedAlbums = Object.values(albumMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        res.json(sortedAlbums);
    } catch (err) {
        console.error('Erreur top albums target:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top albums' });
    }
});

router.get('/users/:userId/spotify/top-genres', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(targetUserId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        const artists = data.items || [];

        const genreMap = {};
        artists.forEach(artist => {
            const genres = getArtistGenres(artist);
            genres.forEach(genre => {
                if (!genreMap[genre]) {
                    genreMap[genre] = 0;
                }
                genreMap[genre] += 1;
            });
        });

        const sortedGenres = Object.entries(genreMap)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        res.json(sortedGenres);
    } catch (err) {
        console.error('Erreur top genres target:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top genres' });
    }
});

router.get('/users/:userId/live', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const accessToken = await getValidUserAccessToken(targetUserId);

        if (!accessToken) {
            return res.json({ isPlaying: false });
        }

        const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (spotifyRes.status === 204 || spotifyRes.status === 404) {
            return res.json({ isPlaying: false });
        }

        if (!spotifyRes.ok) {
            return res.json({ isPlaying: false });
        }

        const data = await spotifyRes.json();
        if (!data || !data.is_playing || !data.item) {
            return res.json({ isPlaying: false });
        }

        res.json({
            isPlaying: true,
            trackName: data.item.name,
            artistName: data.item.artists.map(a => a.name).join(', '),
            albumName: data.item.album.name,
            albumCover: data.item.album.images?.[0]?.url || "",
            progressMs: data.progress_ms,
            durationMs: data.item.duration_ms,
            previewUrl: data.item.preview_url,
            spotifyUrl: data.item.external_urls?.spotify || ""
        });
    } catch (err) {
        console.error("Erreur statut Spotify live:", err);
        res.json({ isPlaying: false });
    }
});

module.exports = router;
