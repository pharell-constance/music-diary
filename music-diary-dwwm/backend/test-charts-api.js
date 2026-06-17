async function test() {
    try {
        const res = await fetch('https://charts-spotify-com-service.spotify.com/public/v0/charts');
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2).substring(0, 2000));
        } else {
            console.log("Error:", await res.text());
        }
    } catch (e) {
        console.error(e);
    }
}

test();
