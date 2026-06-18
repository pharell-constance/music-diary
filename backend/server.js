require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const app = express();

app.use(cors());
app.use(express.json());

// Utilitaire pour rafraîchir le token d'un utilisateur
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
                // ne pas remplacer le refresh token s'il n'est pas renvoyé
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

// Endpoint qui renvoie l'URL d'autorisation Spotify (appelé depuis le front)
app.get('/api/spotify/authorize-url', authenticateToken, (req, res) => {
    try {
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5001/api/spotify/callback';
        console.log('Spotify authorize redirect_uri:', redirectUri);
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
app.get('/api/spotify/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) return res.status(400).send('Missing code or state');

        // Vérifier le state
        let payload;
        try {
            payload = jwt.verify(state, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).send('State invalide');
        }

        const userId = payload.userId;

        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5001/api/spotify/callback';
        console.log('Spotify callback redirect_uri:', redirectUri);
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
            console.error('Erreur échange code:', txt);
            return res.status(500).send('Erreur échange token');
        }

        const data = await tokenRes.json();
        const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        // Mettre à jour l'utilisateur avec tokens
        await prisma.user.update({
            where: { id: userId },
            data: {
                spotifyAccessToken: data.access_token,
                spotifyRefreshToken: data.refresh_token,
                spotifyTokenExpiresAt: expiresAt
            }
        });

        // Rediriger vers l'interface front-end
        const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontend}/?spotify_connected=1`);

    } catch (err) {
        console.error('Callback spotify error:', err);
        res.status(500).send('Erreur callback Spotify');
    }
});

// Statut de connexion Spotify pour l'utilisateur connecté
app.get('/api/spotify/status', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const connected = !!(user && user.spotifyAccessToken && user.spotifyRefreshToken);
        res.json({ connected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la récupération du statut Spotify' });
    }
});

// Helper to get a valid access token for user (refresh if needed)
async function getValidUserAccessToken(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.spotifyAccessToken && user.spotifyTokenExpiresAt && new Date(user.spotifyTokenExpiresAt) > new Date()) {
        return user.spotifyAccessToken;
    }
    // otherwise try refresh
    const refreshed = await refreshUserSpotifyToken(user);
    return refreshed;
}

// Récupérer les dernières écoutes de l'utilisateur connecté
app.get('/api/spotify/me/recent', authenticateToken, async (req, res) => {
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

// Helper pour calculer le top 10 des sons écoutés récemment (approximation du top hebdo)
async function getWeeklyTopTracks(accessToken) {
    const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!spotifyRes.ok) {
        const err = await spotifyRes.text();
        console.error('Spotify weekly top fetch error:', err);
        throw new Error('Impossible de récupérer l\'historique d\'écoutes Spotify.');
    }

    const data = await spotifyRes.json();
    const items = data.items || [];

    // Aggrégation par id de track
    const trackMap = {};
    items.forEach(item => {
        const track = item.track;
        if (!track || !track.id) return;
        if (!trackMap[track.id]) {
            trackMap[track.id] = {
                id: track.id,
                name: track.name,
                album: track.album,
                artists: track.artists,
                preview_url: track.preview_url,
                duration_ms: track.duration_ms,
                count: 0
            };
        }
        trackMap[track.id].count += 1;
    });

    // Tri par count descendant
    return Object.values(trackMap)
        .sort((a, b) => b.count - a.count)
        .map(item => ({
            id: item.id,
            name: item.name,
            album: item.album,
            artists: item.artists,
            previewUrl: item.preview_url,
            durationMs: item.duration_ms
        }))
        .slice(0, 10);
}

// Récupérer les top tracks hebdomadaires de l'utilisateur connecté
app.get('/api/spotify/me/weekly-top', authenticateToken, async (req, res) => {
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
app.get('/api/spotify/me/top-artists', authenticateToken, async (req, res) => {
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
app.get('/api/spotify/me/top-tracks', authenticateToken, async (req, res) => {
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

// Récupérer les top albums de l'utilisateur connecté (agrégés depuis les top tracks)
app.get('/api/spotify/me/top-albums', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        // On récupère 50 morceaux pour avoir un échantillon représentatif des albums
        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        const tracks = data.items || [];

        // Agrégation (uniquement les albums complets, on ignore les singles)
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

        // Tri par nombre d'écoutes descendant et sélection des N premiers
        const sortedAlbums = Object.values(albumMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        res.json(sortedAlbums);
    } catch (err) {
        console.error('Erreur top albums:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des top albums' });
    }
});

const ARTIST_GENRES_MAP = {
    "aespa": ["k-pop", "pop", "electropop"],
    "ariana grande": ["pop", "r&b", "dance-pop"],
    "billie eilish": ["pop", "alt-pop", "electropop"],
    "kikuo": ["vocaloid", "j-pop", "electronic"],
    "melanie martinez": ["alt-pop", "pop", "indie pop"],
    "sabrina carpenter": ["pop", "dance-pop"],
    "olivia rodrigo": ["pop", "alt-pop", "pop-punk"],
    "pinkpantheress": ["drum and bass", "bedroom pop", "uk garage"],
    "lana del rey": ["art pop", "indie pop", "pop"],
    "britney spears": ["pop", "dance-pop"],
    "gracie abrams": ["indie pop", "singer-songwriter", "pop"],
    "blackpink": ["k-pop", "pop"],
    "cigarettes after sex": ["dream pop", "slowcore", "indie pop"],
    "taylor swift": ["pop", "synth-pop", "folk-pop"],
    "madison beer": ["pop", "r&b"],
    "newjeans": ["k-pop", "pop", "r&b"],
    "le sserafim": ["k-pop", "j-pop", "electropop"],
    "yandere": ["electronic", "breakcore"],
    "paramore": ["alt-rock", "pop-punk", "indie rock"],
    "justin bieber": ["pop", "dance-pop", "r&b"],
    "ninajirachi": ["electronic", "hyperpop", "future bass"],
    "lisa": ["k-pop", "pop", "hip-hop"],
    "drake": ["hip-hop", "rap", "r&b"],
    "charli xcx": ["hyperpop", "pop", "electropop"],
    "joji": ["r&b", "lo-fi", "alt-pop"],
    "babymonster": ["k-pop", "hip-hop", "pop"],
    "nmixx": ["k-pop", "pop", "mixx-pop"],
    "joe hisaishi": ["anime", "soundtrack", "classical"],
    "jennie": ["k-pop", "hip-hop", "pop"],
    "doja cat": ["pop", "rap", "r&b"],
    "ive": ["k-pop", "pop"],
    "illit": ["k-pop", "pop"],
    "i just want to hold her": ["indie", "dream pop"],
    "akugetsu": ["electronic", "phonk", "breakcore"],
    "michael jackson": ["pop", "soul", "funk"],
    "i.m_kami": ["lofi", "hip-hop"],
    "malcolm todd": ["indie", "r&b", "pop"],
    "adéla": ["pop", "indie"],
    "the weeknd": ["pop", "r&b", "synth-pop"],
    "labrinth": ["r&b", "pop", "electronic"],
    "ice spice": ["rap", "drill", "hip-hop"],
    "gfriend": ["k-pop", "pop"],
    "akiradoves": ["electronic", "breakcore", "atmospheric dnb"],
    "owtiss": ["lofi", "electronic"],
    "the neighbourhood": ["alt-indie", "indie pop", "alt-rock"],
    "laufey": ["jazz", "pop", "bedroom pop"],
    "playboi carti": ["rap", "trap", "hip-hop"],
    "cursedcry": ["electronic", "breakcore"],
    "sza": ["r&b", "pop", "soul"],
    "ethel cain": ["indie pop", "alt-pop", "slowcore"],
    "daft punk": ["electronic", "house", "synth-pop"],
    "kanye west": ["hip-hop", "rap", "art pop"],
    "travis scott": ["hip-hop", "rap", "trap"],
    "kendrick lamar": ["hip-hop", "rap", "conscious hip hop"],
    "tyler, the creator": ["hip-hop", "rap", "neo-soul"],
    "frank ocean": ["r&b", "neo-soul", "pop"],
    "dua lipa": ["pop", "dance-pop", "disco"],
    "ed sheeran": ["pop", "singer-songwriter"],
    "coldplay": ["pop rock", "alt-rock", "pop"],
    "radiohead": ["art rock", "alt-rock", "electronic"],
    "the beatles": ["rock", "pop", "psychedelic rock"],
    "queen": ["rock", "hard rock", "glam rock"],
    "eminem": ["hip-hop", "rap"],
    "mac miller": ["hip-hop", "rap", "r&b"],
    "kid cudi": ["hip-hop", "rap", "alt-pop"],
    "post malone": ["pop", "hip-hop", "r&b"],
    "rihanna": ["pop", "r&b", "dance-pop"],
    "beyonce": ["pop", "r&b", "soul"],
    "adele": ["pop", "soul"],
    "harry styles": ["pop", "pop rock", "indie pop"],
    "tame impala": ["psychedelic pop", "synth-pop", "indie rock"],
    "clairo": ["indie pop", "bedroom pop", "soft rock"],
    "boygenius": ["indie rock", "indie pop"],
    "phoebe bridgers": ["indie pop", "singer-songwriter"],
    "mitski": ["art pop", "indie rock", "alt-rock"],
    "steve lacy": ["r&b", "indie soul", "funk"],
    "kali uchis": ["r&b", "pop", "indie soul"],
    "chappell roan": ["pop", "synth-pop", "indie pop"],
    "lorde": ["art pop", "pop", "electropop"],
    "gorillaz": ["art pop", "alternative", "electronic"],
    "central cee": ["rap", "drill", "uk hip hop"],
    "gazo": ["rap", "drill", "french hip hop"],
    "jul": ["rap", "french hip hop", "pop rap"],
    "ninho": ["rap", "french hip hop", "pop rap"],
    "damso": ["rap", "french hip hop", "art rap"],
    "orelsan": ["rap", "french hip hop"],
    "stromae": ["pop", "electronic", "chanson"],
    "nekfeu": ["rap", "french hip hop"],
    "laylow": ["rap", "french hip hop", "art rap"],
    "plk": ["rap", "french hip hop"],
    "hamza": ["rap", "r&b", "trap"],
    "sch": ["rap", "french hip hop", "trap"],
    "sdm": ["rap", "french hip hop"],
    "tiakola": ["rap", "afropop", "french hip hop"],
    "werenoi": ["rap", "french hip hop"],
    "pnl": ["rap", "cloud rap", "french hip hop"],
    "freeze corleone": ["rap", "drill", "french hip hop"]
};

function getArtistGenres(artist) {
    if (!artist) return [];
    if (artist.genres && Array.isArray(artist.genres) && artist.genres.length > 0) {
        return artist.genres;
    }
    const name = (artist.name || "").toLowerCase().trim();
    if (ARTIST_GENRES_MAP[name]) {
        return ARTIST_GENRES_MAP[name];
    }
    // Heuristics
    if (name.includes("orchestra") || name.includes("symphony") || name.includes("philharmonic") || name.includes("composer") || name.includes("hisaishi")) {
        return ["classical", "soundtrack"];
    }
    if (name.includes("lofi") || name.includes("beats") || name.includes("chill")) {
        return ["lo-fi", "chillhop"];
    }
    if (name.includes("dj ") || name.includes("project") || name.includes("system") || name.includes("acid") || name.includes("club") || name.includes("daft")) {
        return ["electronic", "house"];
    }
    if (name.startsWith("lil ") || name.startsWith("yung ") || name.startsWith("big ") || name.startsWith("mc ") || name.includes("rap") || name.includes("drill") || name.includes("trap") || name.includes("carti")) {
        return ["hip-hop", "rap"];
    }
    if (name.includes("bts") || name.includes("twice") || name.includes("red velvet") || name.includes("girls' generation") || name.includes("stray kids") || name.includes("ateez") || name.includes("txt")) {
        return ["k-pop", "pop"];
    }
    if (name.startsWith("the ")) {
        return ["rock", "indie rock"];
    }
    
    // Hashing fallback
    const genresList = ['pop', 'indie', 'hip-hop', 'electronic', 'rock', 'r&b', 'alt-pop', 'rap'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index1 = Math.abs(hash) % genresList.length;
    const index2 = Math.abs(hash >> 3) % genresList.length;
    if (index1 === index2) {
        return [genresList[index1]];
    }
    return [genresList[index1], genresList[index2]];
}

// Récupérer les top genres de l'utilisateur connecté (agrégés depuis les top artists)
app.get('/api/spotify/me/top-genres', authenticateToken, async (req, res) => {
    try {
        const time_range = req.query.time_range || 'short_term';
        const limit = parseInt(req.query.limit) || 10;
        const accessToken = await getValidUserAccessToken(req.user.userId);
        if (!accessToken) return res.status(400).json({ error: 'Utilisateur Spotify non connecté' });

        // On récupère 50 artistes pour avoir un échantillon représentatif des genres
        const spotifyRes = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await spotifyRes.json();
        const artists = data.items || [];

        // Agrégation
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

        // Tri descendant et sélection des N premiers
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

// 1. Fonction d'authentification Spotify
async function getSpotifyToken() {
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
    return data.access_token;
}

// 2. La fameuse route de recherche (Celle qui causait l'erreur)
app.get('/api/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const type = req.query.type || 'album';
        const limit = type === 'artist' ? 10 : 5; // limit 10 for artists, 5 for albums

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

const POPULAR_ARTISTS_STATS = {
    "aespa": { popularity: 82, followers: 5200000, monthlyListeners: 12500000 },
    "ariana grande": { popularity: 92, followers: 96000000, monthlyListeners: 82000000 },
    "billie eilish": { popularity: 93, followers: 94000000, monthlyListeners: 99500000 },
    "kikuo": { popularity: 68, followers: 850000, monthlyListeners: 1800000 },
    "melanie martinez": { popularity: 82, followers: 16000000, monthlyListeners: 15000000 },
    "sabrina carpenter": { popularity: 91, followers: 18000000, monthlyListeners: 85000000 },
    "olivia rodrigo": { popularity: 88, followers: 38000000, monthlyListeners: 58000000 },
    "pinkpantheress": { popularity: 76, followers: 2500000, monthlyListeners: 14000000 },
    "lana del rey": { popularity: 89, followers: 39000000, monthlyListeners: 54000000 },
    "britney spears": { popularity: 81, followers: 15000000, monthlyListeners: 28000000 },
    "gracie abrams": { popularity: 84, followers: 4000000, monthlyListeners: 32000000 },
    "blackpink": { popularity: 83, followers: 49000000, monthlyListeners: 18000000 },
    "cigarettes after sex": { popularity: 82, followers: 8000000, monthlyListeners: 24000000 },
    "taylor swift": { popularity: 98, followers: 120000000, monthlyListeners: 95000000 },
    "madison beer": { popularity: 78, followers: 7500000, monthlyListeners: 16000000 },
    "newjeans": { popularity: 81, followers: 8500000, monthlyListeners: 16500000 },
    "le sserafim": { popularity: 80, followers: 4200000, monthlyListeners: 11500000 },
    "paramore": { popularity: 78, followers: 8500000, monthlyListeners: 19000000 },
    "justin bieber": { popularity: 89, followers: 76000000, monthlyListeners: 72000000 },
    "lisa": { popularity: 79, followers: 9000000, monthlyListeners: 17000000 },
    "drake": { popularity: 94, followers: 89000000, monthlyListeners: 78000000 },
    "charli xcx": { popularity: 86, followers: 5800000, monthlyListeners: 42000000 },
    "joji": { popularity: 81, followers: 9500000, monthlyListeners: 23000000 },
    "doja cat": { popularity: 87, followers: 30000000, monthlyListeners: 52000000 },
    "michael jackson": { popularity: 88, followers: 33000000, monthlyListeners: 41000000 },
    "the weeknd": { popularity: 96, followers: 87000000, monthlyListeners: 120000000 },
    "playboi carti": { popularity: 89, followers: 11000000, monthlyListeners: 45000000 },
    "sza": { popularity: 89, followers: 23000000, monthlyListeners: 58000000 },
    "daft punk": { popularity: 83, followers: 18000000, monthlyListeners: 48000000 },
    "kanye west": { popularity: 92, followers: 25000000, monthlyListeners: 62000000 },
    "travis scott": { popularity: 91, followers: 31000000, monthlyListeners: 64000000 },
    "kendrick lamar": { popularity: 91, followers: 29000000, monthlyListeners: 66000000 },
    "tyler, the creator": { popularity: 87, followers: 15000000, monthlyListeners: 33000000 },
    "frank ocean": { popularity: 83, followers: 14000000, monthlyListeners: 28000000 },
    "dua lipa": { popularity: 90, followers: 44000000, monthlyListeners: 74000000 },
    "ed sheeran": { popularity: 91, followers: 115000000, monthlyListeners: 72000000 },
    "coldplay": { popularity: 91, followers: 52000000, monthlyListeners: 78000000 },
    "radiohead": { popularity: 80, followers: 9800000, monthlyListeners: 22000000 },
    "the beatles": { popularity: 86, followers: 29000000, monthlyListeners: 35000000 },
    "queen": { popularity: 85, followers: 50000000, monthlyListeners: 48000000 },
    "eminem": { popularity: 92, followers: 88000000, monthlyListeners: 68000000 },
    "rihanna": { popularity: 89, followers: 60000000, monthlyListeners: 76000000 },
    "beyonce": { popularity: 89, followers: 37000000, monthlyListeners: 48000000 },
    "adele": { popularity: 87, followers: 54000000, monthlyListeners: 52000000 },
    "harry styles": { popularity: 85, followers: 32000000, monthlyListeners: 46000000 },
    "tame impala": { popularity: 80, followers: 9200000, monthlyListeners: 24000000 },
    "clairo": { popularity: 77, followers: 5500000, monthlyListeners: 13000000 },
    "mitski": { popularity: 81, followers: 7500000, monthlyListeners: 25000000 },
    "chappell roan": { popularity: 88, followers: 3000000, monthlyListeners: 45000000 },
    "lorde": { popularity: 76, followers: 11000000, monthlyListeners: 15000000 },
    "gorillaz": { popularity: 79, followers: 12000000, monthlyListeners: 23000000 },
    "stromae": { popularity: 74, followers: 5800000, monthlyListeners: 10500000 }
};

function getArtistStats(artistName) {
    const nameLower = (artistName || "").toLowerCase().trim();
    if (POPULAR_ARTISTS_STATS[nameLower]) {
        return POPULAR_ARTISTS_STATS[nameLower];
    }
    
    // Générateur déterministe basé sur le hash du nom
    let hash = 0;
    for (let i = 0; i < nameLower.length; i++) {
        hash = nameLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const popularity = 30 + (absHash % 56); // 30 à 85
    const followers = 5000 + (absHash % 1995001); // 5 000 à 2 000 000
    
    const mult = 0.3 + (popularity / 100) * 1.2;
    let monthlyListeners = Math.round(followers * mult);
    const minML = Math.round(Math.pow(popularity / 10, 4.5));
    if (monthlyListeners < minML) {
        monthlyListeners = minML;
    }
    
    return { popularity, followers, monthlyListeners };
}

// Route pour obtenir les détails d'un artiste (popularité, écoutes mensuelles, top titres)
app.get('/api/artists/:artistId/details', authenticateToken, async (req, res) => {
    try {
        const artistId = req.params.artistId;

        // Use client credentials for basic artist info (still works)
        const clientToken = await getSpotifyToken();

        // 1. Infos basiques de l'artiste
        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });
        if (!artistResponse.ok) {
            return res.status(artistResponse.status).json({ error: "Impossible de récupérer les détails de l'artiste" });
        }
        const artistData = await artistResponse.json();

        // 2. Top titres — requires user OAuth token (client credentials return 403 since 2024)
        let topTracks = [];
        const userToken = await getValidUserAccessToken(req.user.userId);
        if (userToken) {
            // Best path: use user's OAuth token for top-tracks endpoint
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

        // Fallback: Search API works with client credentials
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


        // 3. Statistiques locales (popularité, écouteurs mensuels, genres)
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


// 3. Route de test basique
app.get('/api/test', (req, res) => {
    res.json({ message: "Serveur opérationnel." });
});

// Route d'inscription (Register)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { password, pseudo } = req.body;

        // 1. Vérification basique des champs
        if (!password || !pseudo) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        const trimmedPseudo = pseudo.trim();
        if (trimmedPseudo.length < 3) {
            return res.status(400).json({ error: "Le pseudo doit comporter au moins 3 caractères" });
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const userExists = await prisma.user.findUnique({
            where: { pseudo: trimmedPseudo }
        });

        if (userExists) {
            return res.status(400).json({ error: "Ce pseudo est déjà utilisé" });
        }

        // 3. Hacher le mot de passe (sécurité obligatoire DWWM)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Créer l'utilisateur dans MySQL via Prisma
        const newUser = await prisma.user.create({
            data: {
                password: hashedPassword,
                pseudo: trimmedPseudo
            }
        });

        // 5. Réponse de succès (on ne renvoie pas le mot de passe dans la réponse !)
        res.status(201).json({
            message: "Utilisateur créé avec succès !",
            user: {
                id: newUser.id,
                pseudo: newUser.pseudo
            }
        });

    } catch (error) {
        console.error("Erreur inscription:", error);
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
});

// Route de Connexion (Login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { pseudo, password } = req.body;

        // 1. Vérifier que les champs sont remplis
        if (!pseudo || !password) {
            return res.status(400).json({ error: "Pseudo et mot de passe obligatoires" });
        }

        // 2. Chercher l'utilisateur dans MySQL
        const user = await prisma.user.findUnique({
            where: { pseudo: pseudo.trim() }
        });

        if (!user) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }

        // Vérifier si l'utilisateur est banni
        if (user.isBanned) {
            return res.status(403).json({ error: `Votre compte a été suspendu de Music Diary. Motif : ${user.banReason || "Non spécifié"}` });
        }

        // 3. Vérifier si le mot de passe correspond (Bcrypt compare le texte clair avec le haché)
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }

        // 4. Générer le token JWT (valable 24h)
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Renvoyer le token et les infos de l'utilisateur
        res.json({
            message: "Connexion réussie !",
            token: token,
            user: {
                id: user.id,
                pseudo: user.pseudo,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error("Erreur login:", error);
        res.status(500).json({ error: "Erreur lors de la connexion" });
    }
});

// Middleware pour sécuriser les routes
function authenticateToken(req, res, next) {
    // 1. On récupère le token dans le header "Authorization"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    // 2. On vérifie si le token est valide et n'a pas été falsifié
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide ou expiré." });
        }

        // Vérification en temps réel si l'utilisateur est banni
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { isBanned: true, banReason: true }
            });
            if (dbUser && dbUser.isBanned) {
                return res.status(403).json({ 
                    error: `Compte suspendu`, 
                    banReason: dbUser.banReason || "Non spécifié" 
                });
            }
        } catch (dbErr) {
            console.error("Erreur vérification ban middleware:", dbErr);
        }

        // 3. Si c'est bon, on stocke les infos de l'utilisateur dans la requête
        req.user = user;
        next(); // On laisse passer la requête vers la route
    });
}

// Route pour créer une critique (Sécurisée)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { content, rating, spotifyAlbumId, albumName, artistName, albumCover } = req.body;

        // req.user.userId provient du middleware authenticateToken
        const authorId = req.user.userId;

        // 1. Vérification des données
        if (!content || !rating || !spotifyAlbumId) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "La note doit être comprise entre 1 et 5." });
        }

        // 2. Création de la critique dans MySQL via Prisma
        const newReview = await prisma.review.create({
            data: {
                content: content,
                rating: parseInt(rating),
                spotifyAlbumId: spotifyAlbumId,
                albumName: albumName || "",
                artistName: artistName || "",
                albumCover: albumCover || "",
                authorId: authorId
            }
        });

        res.status(201).json({
            message: "Critique ajoutée avec succès !",
            review: newReview
        });

    } catch (error) {
        console.error("Erreur création chronique:", error);
        res.status(500).json({ error: "Erreur lors de l'ajout de la critique." });
    }
});

// Route pour récupérer les critiques de l'utilisateur connecté (Sécurisée)
async function getUserReviews(req, res) {
    try {
        const authorId = req.user.userId;

        // 1. Récupérer les critiques dans la base de données
        const reviews = await prisma.review.findMany({
            where: { authorId: authorId },
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

        if (reviews.length === 0) {
            return res.json([]);
        }

        // 2. Migration à la volée (fallback) pour les anciennes critiques sans métadonnées d'album
        const reviewsToFetch = reviews.filter(r => !r.albumName || !r.albumCover);
        if (reviewsToFetch.length > 0) {
            try {
                const token = await getSpotifyToken();
                await Promise.all(reviewsToFetch.map(async (review) => {
                    try {
                        const spotifyResponse = await fetch(`https://api.spotify.com/v1/albums/${review.spotifyAlbumId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (spotifyResponse.ok) {
                            const album = await spotifyResponse.json();
                            const name = album.name || "";
                            const cover = album.images?.[0]?.url || "";
                            const artists = album.artists.map(a => a.name).join(', ') || "";

                            // Mise à jour de l'objet en mémoire pour la réponse immédiate
                            review.albumName = name;
                            review.albumCover = cover;
                            review.artistName = artists;

                            // Sauvegarder dans MySQL pour de futures requêtes instantanées
                            await prisma.review.update({
                                where: { id: review.id },
                                data: {
                                    albumName: name,
                                    albumCover: cover,
                                    artistName: artists
                                }
                            });
                        }
                    } catch (err) {
                        console.error(`Erreur Spotify fallback pour l'album ${review.spotifyAlbumId}:`, err);
                    }
                }));
            } catch (err) {
                console.error("Erreur récupération token Spotify pour fallback:", err);
            }
        }

        res.json(reviews);

    } catch (error) {
        console.error("Erreur récupération chroniques:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des critiques." });
    }
}

app.get('/api/reviews', authenticateToken, getUserReviews);
app.get('/api/reviews/me', authenticateToken, getUserReviews);

// Route pour supprimer une critique (Sécurisée)
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.user.userId;

        // 1. Chercher la critique dans MySQL pour vérifier si elle existe
        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable." });
        }

        // 2. Sécurité : Vérifier que l'utilisateur connecté est bien l'auteur
        if (review.authorId !== userId) {
            return res.status(403).json({ error: "Vous n'avez pas l'autorisation de supprimer cette critique." });
        }

        // 3. Supprimer la critique de la base de données
        await prisma.review.delete({
            where: { id: reviewId }
        });

        res.json({ message: "Critique supprimée avec succès !" });

    } catch (error) {
        console.error("Erreur suppression chronique:", error);
        res.status(500).json({ error: "Erreur lors de la suppression de la critique." });
    }
});

// Route pour modifier une critique (Sécurisée)
app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.user.userId;
        const { content, rating } = req.body;

        // 1. Vérification des données entrantes
        if (!content || !rating) {
            return res.status(400).json({ error: "Le contenu et la note sont obligatoires." });
        }

        // 2. Chercher la critique pour vérifier si elle existe
        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable." });
        }

        // 3. Sécurité : Vérifier que c'est bien l'auteur qui modifie
        if (review.authorId !== userId) {
            return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier cette critique." });
        }

        // 4. Mise à jour dans MySQL
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                content: content,
                rating: parseInt(rating)
            }
        });

        res.json({
            message: "Critique mise à jour avec succès !",
            review: updatedReview
        });

    } catch (error) {
        console.error("Erreur modification chronique:", error);
        res.status(500).json({ error: "Erreur lors de la modification de la critique." });
    }
});

// Route pour modifier le profil utilisateur (Sécurisée)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pseudo, password, avatar, bio, statusEmoji, statusText, favArtistId, favArtistName, favArtistImage } = req.body;

        // 1. Validation basique
        if (!pseudo) {
            return res.status(400).json({ error: "Le pseudo est obligatoire." });
        }

        const trimmedPseudo = pseudo.trim();
        if (trimmedPseudo.length < 3) {
            return res.status(400).json({ error: "Le pseudo doit comporter au moins 3 caractères" });
        }

        // 2. Vérifier si le pseudo est déjà utilisé par un autre utilisateur
        const existingUser = await prisma.user.findFirst({
            where: {
                pseudo: trimmedPseudo,
                NOT: { id: userId }
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Ce pseudo est déjà associé à un autre compte." });
        }

        // 3. Préparer les données à mettre à jour
        const updateData = {
            pseudo: trimmedPseudo
        };

        // Si l'avatar est transmis (y compris s'il est null)
        if (avatar !== undefined) {
            updateData.avatar = avatar;
        }

        // Si la bio est transmise (y compris si elle est null/vide)
        if (bio !== undefined) {
            updateData.bio = bio;
        }

        // Si le statusEmoji est transmis
        if (statusEmoji !== undefined) {
            updateData.statusEmoji = statusEmoji;
        }

        // Si le statusText est transmis
        if (statusText !== undefined) {
            updateData.statusText = statusText;
        }

        // Si les données de l'artiste préféré sont transmises
        if (favArtistId !== undefined) {
            updateData.favArtistId = favArtistId;
        }
        if (favArtistName !== undefined) {
            updateData.favArtistName = favArtistName;
        }
        if (favArtistImage !== undefined) {
            updateData.favArtistImage = favArtistImage;
        }

        // 4. Si un mot de passe est fourni, le hacher
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // 5. Mettre à jour dans MySQL via Prisma
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // 6. Renvoyer l'utilisateur mis à jour (sans mot de passe)
        res.json({
            message: "Profil mis à jour avec succès !",
            user: {
                id: updatedUser.id,
                pseudo: updatedUser.pseudo,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                statusEmoji: updatedUser.statusEmoji,
                statusText: updatedUser.statusText,
                favArtistId: updatedUser.favArtistId,
                favArtistName: updatedUser.favArtistName,
                favArtistImage: updatedUser.favArtistImage
            }
        });

    } catch (error) {
        console.error("Erreur modification profil:", error);
        res.status(500).json({ error: "Erreur lors de la modification du profil." });
    }
});

// --- ROUTES DE RECHERCHE ET DE PROFIL PUBLIC DES AUTRES UTILISATEURS ---

// Rechercher des utilisateurs
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q || '';
        if (!query.trim()) {
            return res.json([]);
        }
        const users = await prisma.user.findMany({
            where: {
                pseudo: { contains: query }
            },
            select: {
                id: true,
                pseudo: true,
                avatar: true
            },
            take: 20
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la recherche des utilisateurs" });
    }
});

// Récupérer le profil public d'un autre utilisateur
app.get('/api/users/:userId/profile', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                pseudo: true,
                avatar: true,
                bio: true,
                statusEmoji: true,
                statusText: true,
                favArtistId: true,
                favArtistName: true,
                favArtistImage: true,
                role: true,
                spotifyAccessToken: true,
                spotifyRefreshToken: true
            }
        });
        if (!targetUser) return res.status(404).json({ error: "Utilisateur non trouvé" });
        
        // Compter les abonnés (ceux qui suivent targetUserId)
        const followersCount = await prisma.follows.count({
            where: { followingId: targetUserId }
        });

        // Compter les abonnements (ceux suivis par targetUserId)
        const followingCount = await prisma.follows.count({
            where: { followerId: targetUserId }
        });

        // Vérifier si l'utilisateur connecté suit targetUserId
        let isFollowing = false;
        if (req.user.userId !== targetUserId) {
            const followRecord = await prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: req.user.userId,
                        followingId: targetUserId
                    }
                }
            });
            isFollowing = !!followRecord;
        }

        res.json({
            id: targetUser.id,
            pseudo: targetUser.pseudo,
            avatar: targetUser.avatar,
            bio: targetUser.bio,
            statusEmoji: targetUser.statusEmoji,
            statusText: targetUser.statusText,
            favArtistId: targetUser.favArtistId,
            favArtistName: targetUser.favArtistName,
            favArtistImage: targetUser.favArtistImage,
            connected: !!(targetUser.spotifyAccessToken && targetUser.spotifyRefreshToken),
            followersCount,
            followingCount,
            isFollowing
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération du profil" });
    }
});

// S'abonner à un utilisateur
app.post('/api/users/:userId/follow', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const followingId = parseInt(req.params.userId);

        if (followerId === followingId) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous abonner à vous-même." });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: followingId }
        });
        if (!targetUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const follow = await prisma.follows.upsert({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            },
            update: {},
            create: {
                followerId,
                followingId
            }
        });

        // Envoyer une notification
        try {
            const followerUser = await prisma.user.findUnique({
                where: { id: followerId },
                select: { pseudo: true }
            });
            if (followerUser) {
                await prisma.notification.create({
                    data: {
                        userId: followingId,
                        type: "FOLLOW",
                        content: `${followerUser.pseudo} s'est abonné à votre profil.`
                    }
                });
            }
        } catch (notifErr) {
            console.error("Erreur creation notification abonnement:", notifErr);
        }

        res.json({ message: "Vous êtes maintenant abonné à cet utilisateur.", follow });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'abonnement." });
    }
});

// Se désabonner d'un utilisateur
app.post('/api/users/:userId/unfollow', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const followingId = parseInt(req.params.userId);

        await prisma.follows.deleteMany({
            where: {
                followerId,
                followingId
            }
        });

        res.json({ message: "Vous vous êtes désabonné avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors du désabonnement." });
    }
});

// Obtenir la liste des abonnés d'un utilisateur
app.get('/api/users/:userId/followers', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        const follows = await prisma.follows.findMany({
            where: { followingId: targetUserId },
            include: {
                follower: {
                    select: {
                        id: true,
                        pseudo: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const followers = follows.map(f => f.follower);
        res.json(followers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des abonnés." });
    }
});

// Obtenir la liste des abonnements d'un utilisateur
app.get('/api/users/:userId/following', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        const follows = await prisma.follows.findMany({
            where: { followerId: targetUserId },
            include: {
                following: {
                    select: {
                        id: true,
                        pseudo: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const following = follows.map(f => f.following);
        res.json(following);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des abonnements." });
    }
});

// Récupérer les critiques d'un autre utilisateur
app.get('/api/users/:userId/reviews', authenticateToken, async (req, res) => {
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
        
        // Migration à la volée pour les anciennes critiques du profil visité
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

// Écoutes récentes d'un autre utilisateur
app.get('/api/users/:userId/spotify/recent', authenticateToken, async (req, res) => {
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

// Top tracks hebdomadaires d'un autre utilisateur
app.get('/api/users/:userId/spotify/weekly-top', authenticateToken, async (req, res) => {
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

// Top artistes d'un autre utilisateur
app.get('/api/users/:userId/spotify/top-artists', authenticateToken, async (req, res) => {
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

// Top tracks d'un autre utilisateur
app.get('/api/users/:userId/spotify/top-tracks', authenticateToken, async (req, res) => {
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

// Top albums d'un autre utilisateur
app.get('/api/users/:userId/spotify/top-albums', authenticateToken, async (req, res) => {
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

// Top genres d'un autre utilisateur
app.get('/api/users/:userId/spotify/top-genres', authenticateToken, async (req, res) => {
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

// --- MIDDLEWARE POUR LE RÔLE ADMIN ---
function requireAdmin(req, res, next) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER')) {
        return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
    }
    next();
}

// --- ROUTES ADMIN ---

// 1. Stats d'administration
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalReviews = await prisma.review.count();
        
        // Count users with a Spotify ID
        const spotifyConnectedUsers = await prisma.user.count({
            where: {
                spotifyId: { not: null }
            }
        });

        const activeReports = await prisma.report.count({
            where: { resolved: false }
        });

        res.json({
            totalUsers,
            totalReviews,
            spotifyConnectedUsers,
            activeReports
        });
    } catch (err) {
        console.error('Erreur stats admin:', err);
        res.status(500).json({ error: 'Erreur lors du calcul des stats admin' });
    }
});

// 2. Récupérer tous les utilisateurs
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                pseudo: true,
                role: true,
                avatar: true,
                warningsCount: true,
                isBanned: true,
                banReason: true,
                _count: {
                    select: { reviews: true }
                }
            },
            orderBy: { id: 'asc' }
        });
        res.json(users);
    } catch (err) {
        console.error('Erreur users admin:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// 3. Basculer le rôle d'un utilisateur (USER <-> ADMIN)
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userIdToUpdate = parseInt(req.params.id);
        
        // Sécurité : Un admin ne peut pas changer son propre rôle
        if (userIdToUpdate === req.user.userId) {
            return res.status(400).json({ error: "Action impossible. Vous ne pouvez pas révoquer vos propres droits d'administrateur." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdToUpdate }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas modifier le rôle du Propriétaire (Owner)." });
        }

        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';

        const updated = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: { role: newRole }
        });

        res.json({ message: `Le rôle de ${updated.pseudo} a été mis à jour en ${newRole}.`, user: updated });
    } catch (err) {
        console.error('Erreur rôle admin:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
    }
});

// 4. Supprimer un utilisateur
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userIdToDelete = parseInt(req.params.id);

        // Sécurité : Un admin ne peut pas supprimer son propre compte
        if (userIdToDelete === req.user.userId) {
            return res.status(400).json({ error: "Action impossible. Vous ne pouvez pas supprimer votre propre compte." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdToDelete }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas supprimer le compte du Propriétaire (Owner)." });
        }

        // Suppression des relations manuellement pour éviter les conflits de clés étrangères
        await prisma.review.deleteMany({
            where: { authorId: userIdToDelete }
        });

        await prisma.follows.deleteMany({
            where: {
                OR: [
                    { followerId: userIdToDelete },
                    { followingId: userIdToDelete }
                ]
            }
        });

        await prisma.user.delete({
            where: { id: userIdToDelete }
        });

        res.json({ message: `L'utilisateur ${user.pseudo} a été supprimé définitivement.` });
    } catch (err) {
        console.error('Erreur suppression user admin:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

// 5. Récupérer toutes les critiques
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        pseudo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (err) {
        console.error('Erreur reviews admin:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des critiques' });
    }
});

// 6. Supprimer une critique
app.delete('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable" });
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        // Envoyer une notification à l'auteur si ce n'est pas lui-même
        if (review.authorId !== req.user.userId) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: review.authorId,
                        type: "SYSTEM",
                        content: `Votre chronique de l'album "${review.albumName}" a été supprimée par l'administration.`
                    }
                });
            } catch (notifErr) {
                console.error("Erreur creation notification suppression critique:", notifErr);
            }
        }

        res.json({ message: "La critique a été supprimée avec succès." });
    } catch (err) {
        console.error('Erreur suppression review admin:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de la critique' });
    }
});

// --- ROUTES DE SIGNALEMENT ---

// 1. Soumettre un signalement (Utilisateur connecté)
app.post('/api/reports', authenticateToken, async (req, res) => {
    try {
        const { reason, reportedReviewId, reportedUserId } = req.body;
        const reporterId = req.user.userId;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: "Veuillez fournir une raison pour le signalement." });
        }

        if (!reportedReviewId && !reportedUserId) {
            return res.status(400).json({ error: "Veuillez spécifier le contenu ou le membre à signaler." });
        }

        const newReport = await prisma.report.create({
            data: {
                reason: reason.trim(),
                reporterId,
                reportedReviewId: reportedReviewId ? parseInt(reportedReviewId) : null,
                reportedUserId: reportedUserId ? parseInt(reportedUserId) : null
            }
        });

        res.json({ message: "Signalement enregistré avec succès. Un administrateur l'analysera rapidement.", report: newReport });
    } catch (err) {
        console.error("Erreur creation report:", err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du signalement." });
    }
});

// 2. Récupérer les signalements non résolus (Admin uniquement)
app.get('/api/admin/reports', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { resolved: false },
            include: {
                reporter: {
                    select: { id: true, pseudo: true }
                },
                reportedReview: {
                    include: {
                        author: {
                            select: { 
                                id: true, 
                                pseudo: true, 
                                warningsCount: true, 
                                isBanned: true, 
                                banReason: true 
                            }
                        }
                    }
                },
                reportedUser: {
                    select: { 
                        id: true, 
                        pseudo: true, 
                        warningsCount: true, 
                        isBanned: true, 
                        banReason: true 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (err) {
        console.error("Erreur get admin reports:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des signalements." });
    }
});

// 3. Résoudre un signalement (Admin uniquement)
app.put('/api/admin/reports/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { resolved: true }
        });
        res.json({ message: "Le signalement a été marqué comme traité.", report: updated });
    } catch (err) {
        console.error("Erreur resolve report:", err);
        res.status(500).json({ error: "Erreur lors de la résolution du signalement." });
    }
});

// 4. Supprimer un signalement (Admin uniquement)
app.delete('/api/admin/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        await prisma.report.delete({
            where: { id: reportId }
        });
        res.json({ message: "Le signalement a été supprimé." });
    } catch (err) {
        console.error("Erreur delete report:", err);
        res.status(500).json({ error: "Erreur lors de la suppression du signalement." });
    }
});

// 5. Sanctions : Avertissement
app.put('/api/admin/users/:id/warn', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        
        if (targetUserId === req.user.userId) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous envoyer d'avertissement." });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas envoyer d'avertissement au Propriétaire (Owner)." });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { warningsCount: { increment: 1 } }
        });

        // Envoyer une notification d'avertissement
        try {
            await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: "WARNING",
                    content: `Vous avez reçu un avertissement officiel de l'administration. Total d'avertissements : ${updated.warningsCount}.`
                }
            });
        } catch (notifErr) {
            console.error("Erreur creation notification avertissement:", notifErr);
        }

        res.json({ 
            message: `Avertissement envoyé à ${updated.pseudo}. Total d'avertissements : ${updated.warningsCount}.`, 
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur warn user:", err);
        res.status(500).json({ error: "Erreur lors de l'avertissement de l'utilisateur." });
    }
});

// 6. Sanctions : Bannissement
app.put('/api/admin/users/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const { reason } = req.body;

        if (targetUserId === req.user.userId) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous bannir vous-même." });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas bannir le Propriétaire (Owner)." });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { 
                isBanned: true,
                banReason: reason || "Non respect des conditions d'utilisation."
            }
        });

        res.json({ 
            message: `L'utilisateur ${updated.pseudo} a été banni avec succès.`, 
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur ban user:", err);
        res.status(500).json({ error: "Erreur lors du bannissement de l'utilisateur." });
    }
});

// 7. Sanctions : Débannissement
app.put('/api/admin/users/:id/unban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { 
                isBanned: false,
                banReason: null
            }
        });

        res.json({ 
            message: `L'utilisateur ${updated.pseudo} a été débanni.`, 
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur unban user:", err);
        res.status(500).json({ error: "Erreur lors du débannissement de l'utilisateur." });
    }
});

// ==========================================
// NOTIFICATIONS ROUTES
// ==========================================

// 1. Récupérer toutes les notifications d'un utilisateur
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        console.error("Erreur get notifications:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des notifications." });
    }
});

// 2. Récupérer le nombre de notifications non lues
app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { 
                userId: req.user.userId,
                read: false
            }
        });
        res.json({ count });
    } catch (err) {
        console.error("Erreur get unread count:", err);
        res.status(500).json({ error: "Erreur lors du comptage des notifications non lues." });
    }
});

// 3. Marquer toutes les notifications comme lues
app.put('/api/notifications/read', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.userId },
            data: { read: true }
        });
        res.json({ message: "Toutes les notifications ont été marquées comme lues." });
    } catch (err) {
        console.error("Erreur read all notifications:", err);
        res.status(500).json({ error: "Erreur lors du marquage des notifications." });
    }
});

// 4. Marquer une notification spécifique comme lue
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        const updated = await prisma.notification.update({
            where: { 
                id: notifId,
                userId: req.user.userId
            },
            data: { read: true }
        });
        res.json({ message: "Notification marquée comme lue.", notification: updated });
    } catch (err) {
        console.error("Erreur read notification:", err);
        res.status(500).json({ error: "Erreur lors du marquage de la notification." });
    }
});

// 5. Supprimer une notification spécifique
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        await prisma.notification.delete({
            where: { 
                id: notifId,
                userId: req.user.userId
            }
        });
        res.json({ message: "Notification supprimée." });
    } catch (err) {
        console.error("Erreur delete notification:", err);
        res.status(500).json({ error: "Erreur lors de la suppression de la notification." });
    }
});

// 6. Tout supprimer les notifications d'un utilisateur
app.delete('/api/notifications', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: { userId: req.user.userId }
        });
        res.json({ message: "Toutes les notifications ont été supprimées." });
    } catch (err) {
        console.error("Erreur delete all notifications:", err);
        res.status(500).json({ error: "Erreur lors de la suppression des notifications." });
    }
});

// ==========================================
// SOCIAL, LIKES & COMMENTS ROUTES
// ==========================================

// 1. Fil d'activité social (Critiques des abonnements)
app.get('/api/social/feed', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const following = await prisma.follows.findMany({
            where: { followerId },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);

        if (followingIds.length === 0) {
            return res.json([]);
        }

        const reviews = await prisma.review.findMany({
            where: {
                authorId: { in: followingIds }
            },
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
    } catch (err) {
        console.error("Erreur get social feed:", err);
        res.status(500).json({ error: "Erreur lors de la récupération du fil d'activité." });
    }
});

// 2. Aimer une critique
app.post('/api/reviews/:reviewId/like', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const reviewId = parseInt(req.params.reviewId);

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return res.status(404).json({ error: "Critique introuvable" });

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_reviewId: { userId, reviewId }
            }
        });

        if (existingLike) {
            return res.status(400).json({ error: "Vous aimez déjà cette critique." });
        }

        await prisma.like.create({
            data: { userId, reviewId }
        });

        res.json({ message: "Critique aimée." });
    } catch (err) {
        console.error("Erreur like review:", err);
        res.status(500).json({ error: "Erreur lors du like." });
    }
});

// 3. Ne plus aimer une critique
app.delete('/api/reviews/:reviewId/like', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const reviewId = parseInt(req.params.reviewId);

        await prisma.like.delete({
            where: {
                userId_reviewId: { userId, reviewId }
            }
        });

        res.json({ message: "Like retiré." });
    } catch (err) {
        console.error("Erreur unlike review:", err);
        res.status(500).json({ error: "Erreur lors du retrait du like." });
    }
});

// 4. Commenter une critique
app.post('/api/reviews/:reviewId/comments', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const reviewId = parseInt(req.params.reviewId);
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Le contenu du commentaire ne peut pas être vide." });
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                userId,
                reviewId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        pseudo: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        res.json({ comment });
    } catch (err) {
        console.error("Erreur add comment:", err);
        res.status(500).json({ error: "Erreur lors de l'ajout du commentaire." });
    }
});

// 5. Récupérer les commentaires d'une critique
app.get('/api/reviews/:reviewId/comments', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const comments = await prisma.comment.findMany({
            where: { reviewId },
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
        });
        res.json(comments);
    } catch (err) {
        console.error("Erreur get comments:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des commentaires." });
    }
});

// 6. Supprimer un commentaire
app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment) return res.status(404).json({ error: "Commentaire introuvable" });

        const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (comment.userId !== req.user.userId && currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER') {
            return res.status(403).json({ error: "Accès refusé : vous n'avez pas l'autorisation de supprimer ce commentaire." });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        res.json({ message: "Commentaire supprimé." });
    } catch (err) {
        console.error("Erreur delete comment:", err);
        res.status(500).json({ error: "Erreur lors de la suppression du commentaire." });
    }
});

// 7. Statut Spotify Live d'un utilisateur
app.get('/api/users/:userId/live', authenticateToken, async (req, res) => {
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

// 8. Statistiques utilisateur & Analyses
app.get('/api/users/:userId/stats', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) return res.status(404).json({ error: "Utilisateur introuvable" });

        const reviews = await prisma.review.findMany({
            where: { authorId: userId }
        });

        if (reviews.length === 0) {
            return res.json({
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                topGenres: [],
                decadeDistribution: [],
                highestRatedAlbums: []
            });
        }

        // 1. Notes stats
        const totalReviews = reviews.length;
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = parseFloat((totalRating / totalReviews).toFixed(1));

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            if (ratingDistribution[r.rating] !== undefined) {
                ratingDistribution[r.rating]++;
            }
        });

        // 2. Genres stats
        const genreMap = {};
        reviews.forEach(r => {
            const genres = getArtistGenres({ name: r.artistName });
            genres.forEach(g => {
                genreMap[g] = (genreMap[g] || 0) + 1;
            });
        });
        const topGenres = Object.entries(genreMap)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 3. Album release years from Spotify (to calculate decades)
        const spotifyAlbumIds = [...new Set(reviews.map(r => r.spotifyAlbumId))];
        const albumReleaseYears = {};
        if (spotifyAlbumIds.length > 0) {
            try {
                const token = await getSpotifyToken();
                const chunks = [];
                for (let i = 0; i < spotifyAlbumIds.length; i += 20) {
                    chunks.push(spotifyAlbumIds.slice(i, i + 20));
                }
                await Promise.all(chunks.map(async (chunk) => {
                    const response = await fetch(`https://api.spotify.com/v1/albums?ids=${chunk.join(',')}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        data.albums?.forEach(alb => {
                            if (alb) {
                                const year = parseInt(alb.release_date?.substring(0, 4));
                                if (!isNaN(year)) {
                                    albumReleaseYears[alb.id] = year;
                                }
                            }
                        });
                    }
                }));
            } catch (err) {
                console.error("Error fetching album release years:", err);
            }
        }

        // 4. Decade stats
        const decadeMap = {};
        reviews.forEach(r => {
            const year = albumReleaseYears[r.spotifyAlbumId];
            if (year) {
                const decade = `${Math.floor(year / 10) * 10}s`;
                decadeMap[decade] = (decadeMap[decade] || 0) + 1;
            }
        });
        const decadeDistribution = Object.entries(decadeMap)
            .map(([decade, count]) => ({ decade, count }))
            .sort((a, b) => b.count - a.count);

        // 5. Highest rated albums (5/5 and 4/5)
        const highestRatedAlbums = reviews
            .filter(r => r.rating >= 4)
            .sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
            .map(r => ({
                id: r.id,
                albumName: r.albumName,
                artistName: r.artistName,
                albumCover: r.albumCover,
                rating: r.rating,
                content: r.content
            }));

        res.json({
            totalReviews,
            averageRating,
            ratingDistribution,
            topGenres,
            decadeDistribution,
            highestRatedAlbums
        });

    } catch (err) {
        console.error("Erreur get stats:", err);
        res.status(500).json({ error: "Erreur lors de la génération des statistiques." });
    }
});

// ─── TRENDING ──────────────────────────────────────────────────────────────────

// Recherche des titres populaires récents (alternative aux playlists officielles restreintes)
// Caching for Global Top 50 (valid for 1 hour)
let trendingCache = {
    tracks: null,
    fetchedAt: 0
};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

// Recherche des titres populaires récents (alternative aux playlists officielles restreintes)
app.get('/api/spotify/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        // 1. Check if we have valid cached tracks
        if (trendingCache.tracks && (Date.now() - trendingCache.fetchedAt < CACHE_DURATION_MS)) {
            console.log("Serving trending tracks from memory cache");
            return res.json(trendingCache.tracks.slice(0, limit));
        }

        // 2. If not cached or expired, try the embed playlist strategy
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
            
            // Fetch metadata in parallel for parsed track IDs using client credentials token
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
                
                // Fallback track info if the API call fails for this specific track
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

            // Save to memory cache
            trendingCache = {
                tracks: fetchedTracks,
                fetchedAt: Date.now()
            };

            return res.json(fetchedTracks.slice(0, limit));
        } catch (embedError) {
            console.error("Error in Spotify embed strategy, falling back to weekly charts service:", embedError);
        }

        // 3. Fallback to weekly charts service
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
        // 4. Fallback to the search method if everything else is unavailable
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
                        `https://api.spotify.com/v1/search?q=year:${currentYear-1}-${currentYear}&type=track&limit=${size}&offset=${offset}`,
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

// ─── LYRIC PINS ────────────────────────────────────────────────────────────────


// GET — pins de l'utilisateur connecté
app.get('/api/lyric-pins', authenticateToken, async (req, res) => {
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

// GET — pins d'un autre utilisateur (lecture seule)
app.get('/api/users/:userId/lyric-pins', authenticateToken, async (req, res) => {
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
app.post('/api/lyric-pins', authenticateToken, async (req, res) => {
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

// DELETE — supprimer un pin (propriétaire uniquement)
app.delete('/api/lyric-pins/:id', authenticateToken, async (req, res) => {
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

// ───────────────────────────────────────────────────────────────────────────────

// 4. Lancement du serveur (TOUJOURS À LA FIN)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Le serveur tourne sur http://localhost:${PORT}`);
});