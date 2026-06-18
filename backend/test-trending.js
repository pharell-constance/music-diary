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
        const currentYear = new Date().getFullYear();
        
        // Test limit=10, offset=10
        const res = await fetch(`https://api.spotify.com/v1/search?q=year:${currentYear-1}-${currentYear}&type=track&limit=10&offset=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Offset 10 Status:", res.status);
        if (res.status === 200) {
            const data = await res.json();
            console.log("Items fetched at offset 10:", data.tracks?.items?.length);
        } else {
            console.log("Error Body:", await res.text());
        }
    } catch (err) {
        console.error(err);
    }
}

test();
