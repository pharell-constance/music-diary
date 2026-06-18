const dotenv = require('dotenv');
dotenv.config();

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

async function test() {
    try {
        const token = await getSpotifyToken();
        console.log("Access Token:", token.substring(0, 20) + "...");
        
        const url = `https://api.spotify.com/v1/search?q=Aya+Nakamura&type=track&limit=1`;
        console.log("Fetching URL:", url);
        
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Status:", res.status);
        console.log("Headers:");
        for (const [k, v] of res.headers.entries()) {
            console.log(`  ${k}: ${v}`);
        }
        
        const data = await res.json();
        console.log("Full JSON response (first 2000 chars):");
        console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    } catch (err) {
        console.error(err);
    }
}

test();
