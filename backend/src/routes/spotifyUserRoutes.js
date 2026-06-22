const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { getValidUserAccessToken } = require('../services/spotifyAuthService');
const { getWeeklyTopTracks, getArtistGenres } = require('../services/spotifyDataService');

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

module.exports = router;
