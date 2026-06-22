const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const {
    getSpotifyToken,
    getValidUserAccessToken,
    getWeeklyTopTracks,
    getArtistGenres,
    parseSpotifyApiError
} = require('../services/spotifyService');

const DEFAULT_SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5001/api/spotify/callback';

// Diagnostic Spotify (public)
router.get('/spotify/setup-check', async (req, res) => {
    try {
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'User'
              AND COLUMN_NAME LIKE 'spotify%'
        `;
        const serializedColumns = columns.map(col => {
            const newCol = { ...col };
            for (const key in newCol) {
                if (typeof newCol[key] === 'bigint') {
                    newCol[key] = newCol[key].toString();
                }
            }
            return newCol;
        });
        res.json({
            env: {
                clientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
                clientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
                redirectUri: process.env.SPOTIFY_REDIRECT_URI || DEFAULT_SPOTIFY_REDIRECT_URI,
                frontendUrl: process.env.FRONTEND_URL || null,
                jwtSecret: Boolean(process.env.JWT_SECRET),
            },
            columns: serializedColumns,
        });
    } catch (err) {
        console.error('setup-check error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint qui renvoie l'URL d'autorisation Spotify
router.get('/spotify/authorize-url', authenticateToken, (req, res) => {
    try {
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || DEFAULT_SPOTIFY_REDIRECT_URI;
        if (!process.env.SPOTIFY_CLIENT_ID) {
            return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID manquant sur le serveur' });
        }
        const state = jwt.sign({ userId: req.user.userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const scope = 'user-read-recently-played user-top-read user-read-private user-read-currently-playing';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: redirectUri,
            state: state
        });
        const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
        res.json({ url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Impossible de créer l\'URL d\'autorisation Spotify' });
    }
});

// Callback que Spotify appellera après autorisation
router.get('/spotify/callback', async (req, res) => {
    try {
        const { code, state, error: spotifyError } = req.query;
        if (spotifyError) {
            console.error('Spotify OAuth error:', spotifyError, req.query.error_description || '');
            return res.status(400).send(`Spotify a refusé l'autorisation: ${spotifyError}`);
        }
        if (!code || !state) return res.status(400).send('Missing code or state');

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET manquant');
            return res.status(500).send('Configuration serveur incomplète (JWT_SECRET)');
        }

        let payload;
        try {
            payload = jwt.verify(state, process.env.JWT_SECRET);
        } catch (err) {
            console.error('State JWT invalide:', err.message);
            return res.status(400).send('State invalide ou expiré — reconnectez Spotify depuis votre profil');
        }

        const userId = payload.userId;
        if (!userId) {
            return res.status(400).send('State invalide (userId manquant)');
        }

        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || DEFAULT_SPOTIFY_REDIRECT_URI;

        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            console.error('Spotify credentials manquantes sur le serveur');
            return res.status(500).send('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET manquant sur Render');
        }

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET
        });

        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!tokenRes.ok) {
            const txt = await tokenRes.text();
            const spotifyErr = parseSpotifyApiError(txt);
            console.error('Erreur échange code:', txt);
            return res.status(500).send(`Erreur échange token Spotify: ${spotifyErr}`);
        }

        const data = await tokenRes.json();
        if (!data.access_token) {
            console.error('Réponse Spotify sans access_token:', data);
            return res.status(500).send('Réponse Spotify invalide (pas de access_token)');
        }

        const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existingUser) {
            console.error('Utilisateur introuvable pour Spotify callback:', userId);
            return res.status(404).send('Utilisateur introuvable');
        }

        const updateData = {
            spotifyAccessToken: data.access_token,
            spotifyTokenExpiresAt: expiresAt
        };
        if (data.refresh_token) {
            updateData.spotifyRefreshToken = data.refresh_token;
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        return res.redirect(`${frontend}/?spotify_connected=1`);

    } catch (err) {
        console.error('Callback spotify error:', err);
        res.status(500).send(`Erreur callback Spotify: ${err.message || 'erreur inconnue'}`);
    }
});

// Statut de connexion Spotify pour l'utilisateur connecté
router.get('/spotify/status', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const connected = !!(user && user.spotifyAccessToken && user.spotifyRefreshToken);
        res.json({ connected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la récupération du statut Spotify' });
    }
});

// Récupérer les dernières écoutes de l'utilisateur connecté
router.get('/spotify/me/recent', authenticateToken, async (req, res) => {
    try {
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur recent plays:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des dernières lectures' });
    }
});

// Récupérer les top tracks hebdomadaires de l'utilisateur connecté
router.get('/spotify/me/weekly-top', authenticateToken, async (req, res) => {
    try {
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const tracks = await getWeeklyTopTracks(accessToken);
        res.json(tracks);
    } catch (err) {
        console.error('Erreur weekly-top:', err);
        res.status(500).json({ error: err.message || 'Erreur lors de la génération du top hebdomadaire' });
    }
});

// Récupérer les top artists de l'utilisateur connecté
router.get('/spotify/me/top-artists', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur top artists:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top artists' });
    }
});

// Récupérer les top tracks de l'utilisateur connecté
router.get('/spotify/me/top-tracks', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        res.json(data.items || data);
    } catch (err) {
        console.error('Erreur top tracks:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top tracks' });
    }
});

// Récupérer les top albums de l'utilisateur connecté
router.get('/spotify/me/top-albums', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
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
        console.error('Erreur top albums:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top albums' });
    }
});

// Récupérer les top genres de l'utilisateur connecté
router.get('/spotify/me/top-genres', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
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
        console.error('Erreur top genres:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top genres' });
    }
});

// La fameuse route de recherche
router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const type = req.query.type || 'album';
        console.log(`[Backend Search] query="${searchQuery}" type="${type}"`);
        const limit = type === 'artist' ? 10 : type === 'track' ? 10 : 5;

        if (!searchQuery) {
            return res.status(400).json({ error: "Veuillez fournir une recherche avec ?q=" });
        }

        const token = await getSpotifyToken();

        const spotifyResponse = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=${type}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await spotifyResponse.json();
        res.json(data);

    } catch (error) {
        console.error("Erreur Spotify:", error);
        res.status(500).json({ error: "Erreur lors de la communication avec Spotify" });
    }
});

// Caching structure for Global Top 50 (valid for 1 hour)
let trendingCache = {
    tracks: null,
    fetchedAt: 0
};
const CACHE_DURATION_MS = 60 * 60 * 1000;

// Recherche des titres populaires récents (alternative aux playlists officielles restreintes)
router.get('/spotify/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        if (trendingCache.tracks && (Date.now() - trendingCache.fetchedAt < CACHE_DURATION_MS)) {
            console.log("Serving trending tracks from memory cache");
            return res.json(trendingCache.tracks.slice(0, limit));
        }

        try {
            console.log("Fetching live Global Top 50 from Spotify embed player...");
            const embedRes = await fetch('https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
                }
            });
            if (!embedRes.ok) {
                throw new Error(`Failed to fetch Spotify embed: ${embedRes.status}`);
            }

            const html = await embedRes.text();
            const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/gi;
            const match = nextDataRegex.exec(html);
            if (!match) {
                throw new Error("Could not find __NEXT_DATA__ script tag in embed HTML");
            }

            const data = JSON.parse(match[1]);
            const trackList = data.props?.pageProps?.state?.data?.entity?.trackList || [];

            if (trackList.length === 0) {
                throw new Error("No tracks found in the embed state data");
            }

            const token = await getSpotifyToken();

            const fetchedTracks = await Promise.all(trackList.map(async (item, idx) => {
                const trackId = item.uri?.split(':').pop() || `track-${idx}`;
                try {
                    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (trackRes.ok) {
                        const trackData = await trackRes.json();
                        return {
                            rank: idx + 1,
                            id: trackId,
                            name: trackData.name || item.title || 'Inconnu',
                            artists: trackData.artists?.map(a => a.name).join(', ') || item.subtitle || 'Artiste Inconnu',
                            albumName: trackData.album?.name || 'Top Global',
                            albumCover: trackData.album?.images?.[0]?.url || null,
                            albumId: trackData.album?.id || '',
                            popularity: trackData.popularity !== undefined ? trackData.popularity : Math.max(50, 99 - idx),
                            previewUrl: trackData.preview_url || null,
                            durationMs: trackData.duration_ms || item.duration || 180000
                        };
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching track metadata for ${trackId}:`, fetchErr);
                }

                // Fallback Search
                try {
                    const cleanQuery = encodeURIComponent(`track:${item.title} artist:${item.subtitle}`);
                    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${cleanQuery}&type=track&limit=1`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (searchRes.ok) {
                        const searchData = await searchRes.json();
                        const foundTrack = searchData.tracks?.items?.[0];
                        if (foundTrack) {
                            return {
                                rank: idx + 1,
                                id: foundTrack.id,
                                name: foundTrack.name,
                                artists: foundTrack.artists?.map(a => a.name).join(', ') || item.subtitle || 'Artiste Inconnu',
                                albumName: foundTrack.album?.name || 'Top Global',
                                albumCover: foundTrack.album?.images?.[0]?.url || null,
                                albumId: foundTrack.album?.id || '',
                                popularity: foundTrack.popularity !== undefined ? foundTrack.popularity : Math.max(50, 99 - idx),
                                previewUrl: foundTrack.preview_url || null,
                                durationMs: foundTrack.duration_ms || item.duration || 180000
                            };
                        }
                    }
                } catch (searchErr) {
                    console.error("Error fetching fallback metadata via search:", searchErr);
                }

                return {
                    rank: idx + 1,
                    id: trackId,
                    name: item.title || 'Inconnu',
                    artists: item.subtitle || 'Artiste Inconnu',
                    albumName: 'Top Global',
                    albumCover: null,
                    albumId: '',
                    popularity: Math.max(50, 99 - idx),
                    previewUrl: item.audioPreview?.url || null,
                    durationMs: item.duration || 180000
                };
            }));

            trendingCache = {
                tracks: fetchedTracks,
                fetchedAt: Date.now()
            };

            return res.json(fetchedTracks.slice(0, limit));
        } catch (embedError) {
            console.error("Error in Spotify embed strategy, falling back to weekly charts service:", embedError);
        }

        // charts fallback
        const chartsRes = await fetch('https://charts-spotify-com-service.spotify.com/public/v0/charts');
        if (!chartsRes.ok) {
            throw new Error(`Failed to fetch public weekly charts: ${chartsRes.status}`);
        }

        const chartsData = await chartsRes.json();
        const responseList = chartsData.chartEntryViewResponses || [];

        const chartResponse = responseList.find(c =>
            c.displayChart?.chartMetadata?.alias === 'REGIONAL_GLOBAL_WEEKLY'
        ) || responseList[0];

        if (!chartResponse) {
            throw new Error("No chart found in Spotify charts response");
        }

        const entries = chartResponse.entries || [];
        const tracksToFetch = entries.slice(0, limit);

        const tracks = tracksToFetch.map((entry, idx) => {
            const trackMetadata = entry.trackMetadata || {};
            const uri = trackMetadata.trackUri || '';
            const id = uri.split(':').pop() || `track-${idx}`;
            const pseudoDurationMs = (150 + (idx * 7) % 91) * 1000;
            const popularity = Math.max(50, 99 - idx);

            return {
                rank: entry.chartEntryData?.currentRank || (idx + 1),
                id: id,
                name: trackMetadata.trackName || 'Inconnu',
                artists: trackMetadata.artists?.map(a => a.name).join(', ') || 'Artiste Inconnu',
                albumName: 'Top Global',
                albumCover: trackMetadata.displayImageUri || null,
                albumId: '',
                popularity: popularity,
                previewUrl: null,
                durationMs: pseudoDurationMs
            };
        });

        res.json(tracks);
    } catch (err) {
        console.error('Erreur trending (fallback final):', err);
        try {
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const token = await getSpotifyToken();
            const currentYear = new Date().getFullYear();
            const chunkSize = 10;
            const numRequests = Math.ceil(limit / chunkSize);

            const fetchPromises = [];
            for (let i = 0; i < numRequests; i++) {
                const offset = i * chunkSize;
                const size = Math.min(chunkSize, limit - offset);
                fetchPromises.push(
                    fetch(
                        `https://api.spotify.com/v1/search?q=year:${currentYear - 1}-${currentYear}&type=track&limit=${size}&offset=${offset}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ).then(async (searchRes) => {
                        if (!searchRes.ok) return [];
                        const data = await searchRes.json();
                        return data.tracks?.items || [];
                    })
                );
            }

            const resultsArray = await Promise.all(fetchPromises);
            const allTracks = resultsArray.flat();

            const fallbackTracks = allTracks
                .map((track, idx) => ({
                    rank: idx + 1,
                    id: track.id,
                    name: track.name,
                    artists: track.artists?.map(a => a.name).join(', '),
                    albumName: track.album?.name || 'Album',
                    albumCover: track.album?.images?.[0]?.url || null,
                    albumId: track.album?.id,
                    popularity: track.popularity !== undefined ? track.popularity : Math.max(50, 95 - idx),
                    previewUrl: track.preview_url || null,
                    durationMs: track.duration_ms || 180000,
                }))
                .filter(t => t.id)
                .slice(0, limit);

            res.json(fallbackTracks);
        } catch (fallbackErr) {
            console.error('Erreur fallback trending:', fallbackErr);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
});

module.exports = router;
