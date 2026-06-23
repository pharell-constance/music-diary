const ARTIST_GENRES_MAP = require('../config/spotifyGenres');
const POPULAR_ARTISTS_STATS = require('../config/spotifyStats');

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
    
    const name = (artist.name || artist.artistName || "").toLowerCase().trim();
    const vocaloidKeywords = [
        "miku", "rin", "len", "luka", "gumi", "kaito", "meiko", "vocaloid", "deco*27", 
        "pinocchiop", "mitchie m", "kikuo", "wowaka", "neru", "inabakumori", 
        "syudou", "kanaria", "maretu", "hachi", "n-buna", "orangestar", "utau", "kasane teto"
    ];
    const isVocaloid = vocaloidKeywords.some(keyword => name.includes(keyword));

    let genres = [];
    if (artist.genres && Array.isArray(artist.genres) && artist.genres.length > 0) {
        genres = [...artist.genres];
    } else if (ARTIST_GENRES_MAP[name]) {
        genres = [...ARTIST_GENRES_MAP[name]];
    } else {
        if (name.includes("orchestra") || name.includes("symphony") || name.includes("philharmonic") || name.includes("composer") || name.includes("hisaishi")) {
            genres = ["classical", "soundtrack"];
        } else if (name.includes("lofi") || name.includes("beats") || name.includes("chill")) {
            genres = ["lo-fi", "chillhop"];
        } else if (name.includes("dj ") || name.includes("project") || name.includes("system") || name.includes("acid") || name.includes("club") || name.includes("daft")) {
            genres = ["electronic", "house"];
        } else if (name.startsWith("lil ") || name.startsWith("yung ") || name.startsWith("big ") || name.startsWith("mc ") || name.includes("rap") || name.includes("drill") || name.includes("trap") || name.includes("carti")) {
            genres = ["hip-hop", "rap"];
        } else if (name.includes("bts") || name.includes("twice") || name.includes("red velvet") || name.includes("girls' generation") || name.includes("stray kids") || name.includes("ateez") || name.includes("txt")) {
            genres = ["k-pop", "pop"];
        } else if (name.startsWith("the ")) {
            genres = ["rock", "indie rock"];
        } else {
            const genresList = ['pop', 'indie', 'hip-hop', 'electronic', 'rock', 'r&b', 'alt-pop', 'rap'];
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index1 = Math.abs(hash) % genresList.length;
            const index2 = Math.abs(hash >> 3) % genresList.length;
            genres = index1 === index2 ? [genresList[index1]] : [genresList[index1], genresList[index2]];
        }
    }

    if (isVocaloid && !genres.includes("vocaloid")) {
        genres.unshift("vocaloid");
    }
    return genres;
}

function getArtistStats(artistName) {
    const nameLower = (artistName || "").toLowerCase().trim();
    if (POPULAR_ARTISTS_STATS[nameLower]) {
        return POPULAR_ARTISTS_STATS[nameLower];
    }

    let hash = 0;
    for (let i = 0; i < nameLower.length; i++) {
        hash = nameLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const popularity = 30 + (absHash % 56);
    const followers = 5000 + (absHash % 1995001);

    const mult = 0.3 + (popularity / 100) * 1.2;
    let monthlyListeners = Math.round(followers * mult);
    const minML = Math.round(Math.pow(popularity / 10, 4.5));
    if (monthlyListeners < minML) {
        monthlyListeners = minML;
    }

    return { popularity, followers, monthlyListeners };
}

module.exports = {
    getWeeklyTopTracks,
    getArtistGenres,
    getArtistStats
};
