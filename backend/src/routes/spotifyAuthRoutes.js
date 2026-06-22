const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const { parseSpotifyApiError } = require('../services/spotifyAuthService');

const DEFAULT_SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5001/api/spotify/callback';

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

module.exports = router;
