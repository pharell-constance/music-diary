const prisma = require('../config/db');

function parseSpotifyApiError(body) {
    try {
        const parsed = JSON.parse(body);
        return parsed.error_description || parsed.error || body;
    } catch {
        return body;
    }
}

let cachedClientToken = null;
let cachedClientTokenExpiresAt = null;

async function getSpotifyToken() {
    if (cachedClientToken && cachedClientTokenExpiresAt && Date.now() < cachedClientTokenExpiresAt) {
        return cachedClientToken;
    }
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET
        })
    });
    
    const data = await response.json();
    if (data.access_token) {
        cachedClientToken = data.access_token;
        const expiresIn = data.expires_in || 3600;
        cachedClientTokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
        return cachedClientToken;
    }
    return null;
}

async function refreshUserSpotifyToken(user) {
    if (!user?.spotifyRefreshToken) return null;
    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: user.spotifyRefreshToken,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            console.error('Erreur refresh token spotify', await response.text());
            return null;
        }

        const data = await response.json();
        const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                spotifyAccessToken: data.access_token,
                spotifyRefreshToken: data.refresh_token || user.spotifyRefreshToken,
                spotifyTokenExpiresAt: expiresAt
            }
        });

        return data.access_token;
    } catch (err) {
        console.error('Erreur rafraîchissement token:', err);
        return null;
    }
}

async function getValidUserAccessToken(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.spotifyAccessToken && user.spotifyTokenExpiresAt && new Date(user.spotifyTokenExpiresAt) > new Date()) {
        return user.spotifyAccessToken;
    }
    const refreshed = await refreshUserSpotifyToken(user);
    return refreshed;
}

module.exports = {
    parseSpotifyApiError,
    getSpotifyToken,
    refreshUserSpotifyToken,
    getValidUserAccessToken
};
