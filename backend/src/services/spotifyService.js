const prisma = require('../config/db');
const { ARTIST_GENRES_MAP, POPULAR_ARTISTS_STATS } = require('../config/spotifyData');

function parseSpotifyApiError(body) {
    try {
        const parsed = JSON.parse(body);
        return parsed.error_description || parsed.error || body;
    } catch {
        return body;
    }
}

// Memory caching for Spotify Client credentials token
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
        // Expire 60 seconds early for safety margin
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

function getArtistStats(artistName) {
    const nameLower = (artistName || "").toLowerCase().trim();
    if (POPULAR_ARTISTS_STATS[nameLower]) {
        return POPULAR_ARTISTS_STATS[nameLower];
    }

    // Deterministic random stats based on name hash
    let hash = 0;
    for (let i = 0; i < nameLower.length; i++) {
        hash = nameLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const popularity = 30 + (absHash % 56); // 30 to 85
    const followers = 5000 + (absHash % 1995001); // 5,000 to 2,000,000

    const mult = 0.3 + (popularity / 100) * 1.2;
    let monthlyListeners = Math.round(followers * mult);
    const minML = Math.round(Math.pow(popularity / 10, 4.5));
    if (monthlyListeners < minML) {
        monthlyListeners = minML;
    }

    return { popularity, followers, monthlyListeners };
}

module.exports = {
    parseSpotifyApiError,
    getSpotifyToken,
    refreshUserSpotifyToken,
    getValidUserAccessToken,
    getWeeklyTopTracks,
    getArtistGenres,
    getArtistStats
};
