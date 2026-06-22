const express = require('express');
const router = express.Router();
const { getSpotifyToken } = require('../services/spotifyAuthService');

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

let trendingCache = {
    tracks: null,
    fetchedAt: 0
};
const CACHE_DURATION_MS = 60 * 60 * 1000;

// Recherche des titres populaires récents
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
