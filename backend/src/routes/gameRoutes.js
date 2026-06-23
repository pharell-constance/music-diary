const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

// Mélange un tableau de façon aléatoire (Fisher-Yates)
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

router.get('/game/blindtest', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Récupérer l'artiste favori de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                favArtistId: true,
                favArtistName: true,
                favArtistImage: true
            }
        });

        if (!user || !user.favArtistId || !user.favArtistName) {
            return res.status(400).json({
                error: "Veuillez choisir un artiste favori dans votre profil avant de jouer."
            });
        }

        const artistId = user.favArtistId;
        const artistName = user.favArtistName;
        const artistImage = user.favArtistImage;

        // 2. Interroger l'API iTunes Search (public, gratuit, sans token et previewUrl garanti)
        console.log(`[BlindTest] Recherche de morceaux pour l'artiste : "${artistName}" sur iTunes...`);
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicTrack&limit=50`;
        
        const itunesRes = await fetch(itunesUrl);
        if (!itunesRes.ok) {
            return res.status(502).json({ error: "Impossible de récupérer les extraits musicaux depuis iTunes." });
        }

        const data = await itunesRes.json();
        const results = data.results || [];

        // 3. Filtrer les morceaux (vérifier l'artiste et la présence de previewUrl)
        const trackPool = [];
        const seenTrackNames = new Set();

        for (const t of results) {
            // S'assurer que l'artiste correspond (pour éviter des homonymes ou featurings indésirables si possible)
            const isTargetArtist = t.artistName && (
                t.artistName.toLowerCase().includes(artistName.toLowerCase()) ||
                artistName.toLowerCase().includes(t.artistName.toLowerCase())
            );

            if (isTargetArtist && t.previewUrl && t.trackName) {
                const cleanName = t.trackName.trim();
                // Éviter les doublons exacts de noms de chansons (ex: live, remaster)
                const lowerName = cleanName.toLowerCase();
                if (!seenTrackNames.has(lowerName)) {
                    seenTrackNames.add(lowerName);
                    trackPool.push({
                        id: t.trackId ? t.trackId.toString() : Math.random().toString(),
                        name: cleanName,
                        previewUrl: t.previewUrl,
                        albumCover: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '400x400bb') : "" // Agrandir la couverture
                    });
                }
            }
        }

        console.log(`[BlindTest] Morceaux uniques avec extraits trouvés : ${trackPool.length}`);

        // 4. Si aucun morceau n'est trouvé
        if (trackPool.length === 0) {
            return res.status(404).json({
                error: `Aucun extrait audio n'a pu être récupéré pour l'artiste "${artistName}". Veuillez essayer un autre artiste.`
            });
        }

        // S'il y a trop peu de morceaux différents pour générer 4 choix uniques
        if (trackPool.length < 4) {
            const placeholders = ["L'Aventurier", "Get Lucky", "Blinding Lights", "One More Time", "Stayin' Alive", "Billie Jean"];
            for (let i = 0; i < 4; i++) {
                if (!trackPool.find(t => t.name === placeholders[i])) {
                    trackPool.push({
                        id: `placeholder-${i}`,
                        name: placeholders[i],
                        previewUrl: null,
                        albumCover: ""
                    });
                }
            }
        }

        // 5. Sélectionner 10 morceaux pour les questions
        const numberOfQuestions = Math.min(10, trackPool.length);
        const shuffledPool = shuffle(trackPool);
        const selectedTracks = shuffledPool.slice(0, numberOfQuestions);

        // 6. Construire les questions
        const questions = selectedTracks.map((track) => {
            // Pool de titres incorrects
            const incorrectTitles = trackPool
                .filter(t => t.name.toLowerCase() !== track.name.toLowerCase())
                .map(t => t.name);

            // Filtrer les doublons de noms
            const uniqueIncorrect = [...new Set(incorrectTitles)];
            const shuffledIncorrect = shuffle(uniqueIncorrect);
            
            // Prendre 3 faux titres
            const chosenIncorrect = shuffledIncorrect.slice(0, 3);

            // Si on n'a toujours pas 3 faux titres, combler
            while (chosenIncorrect.length < 3) {
                chosenIncorrect.push(`Chanson Alternative ${chosenIncorrect.length + 1}`);
            }

            // Mélanger la bonne réponse et les fausses
            const options = shuffle([track.name, ...chosenIncorrect]);

            return {
                id: track.id,
                previewUrl: track.previewUrl,
                albumCover: track.albumCover,
                correctAnswer: track.name,
                options
            };
        }).filter(q => q.previewUrl !== null); // S'assurer qu'aucun morceau sans preview ne devienne une question

        // Renvoyer les résultats
        res.json({
            artist: {
                id: artistId,
                name: artistName,
                image: artistImage
            },
            questions: questions.slice(0, 10)
        });

    } catch (err) {
        console.error("Erreur API Blind Test:", err);
        res.status(500).json({ error: "Erreur lors de la préparation du blind test." });
    }
});

router.get('/game/guessthecover', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Récupérer l'artiste favori de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                favArtistId: true,
                favArtistName: true,
                favArtistImage: true
            }
        });

        if (!user || !user.favArtistId || !user.favArtistName) {
            return res.status(400).json({
                error: "Veuillez choisir un artiste favori dans votre profil avant de jouer."
            });
        }

        const artistId = user.favArtistId;
        const artistName = user.favArtistName;
        const artistImage = user.favArtistImage;

        // 2. Interroger iTunes Search API
        console.log(`[GuessTheCover] Recherche d'albums pour l'artiste : "${artistName}" sur iTunes...`);
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=40`;
        
        const itunesRes = await fetch(itunesUrl);
        if (!itunesRes.ok) {
            return res.status(502).json({ error: "Impossible de récupérer les albums depuis iTunes." });
        }

        const data = await itunesRes.json();
        const results = data.results || [];

        // 3. Filtrer et nettoyer les albums
        const albumPool = [];
        const seenAlbumNames = new Set();

        for (const a of results) {
            const isTargetArtist = a.artistName && (
                a.artistName.toLowerCase().includes(artistName.toLowerCase()) ||
                artistName.toLowerCase().includes(a.artistName.toLowerCase())
            );

            if (isTargetArtist && a.artworkUrl100 && a.collectionName) {
                const cleanName = a.collectionName.trim();
                const lowerName = cleanName.toLowerCase();
                // Éviter les singles redondants ou doublons de noms
                if (!seenAlbumNames.has(lowerName)) {
                    seenAlbumNames.add(lowerName);
                    albumPool.push({
                        id: a.collectionId ? a.collectionId.toString() : Math.random().toString(),
                        name: cleanName,
                        albumCover: a.artworkUrl100.replace('100x100bb', '600x600bb') // Image de haute qualité
                    });
                }
            }
        }

        console.log(`[GuessTheCover] Albums uniques trouvés : ${albumPool.length}`);

        // 4. Si aucun album n'est trouvé
        if (albumPool.length === 0) {
            return res.status(404).json({
                error: `Aucun album n'a pu être récupéré pour l'artiste "${artistName}". Veuillez essayer un autre artiste.`
            });
        }

        // Si moins de 4 albums, on complète avec des placeholders
        if (albumPool.length < 4) {
            const placeholders = ["Abbey Road", "Thriller", "Random Access Memories", "The Dark Side of the Moon", "Back to Black", "Discovery"];
            for (let i = 0; i < 4; i++) {
                if (!albumPool.find(a => a.name === placeholders[i])) {
                    albumPool.push({
                        id: `placeholder-${i}`,
                        name: placeholders[i],
                        albumCover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600"
                    });
                }
            }
        }

        // 5. Sélectionner 10 albums pour les questions
        const numberOfQuestions = Math.min(10, albumPool.length);
        const shuffledPool = shuffle(albumPool);
        const selectedAlbums = shuffledPool.slice(0, numberOfQuestions);

        // 6. Construire les questions
        const questions = selectedAlbums.map((album) => {
            // Pool de noms d'albums incorrects
            const incorrectTitles = albumPool
                .filter(a => a.name.toLowerCase() !== album.name.toLowerCase())
                .map(a => a.name);

            // Filtrer les doublons de noms
            const uniqueIncorrect = [...new Set(incorrectTitles)];
            const shuffledIncorrect = shuffle(uniqueIncorrect);
            
            // Prendre 3 faux titres
            const chosenIncorrect = shuffledIncorrect.slice(0, 3);

            // Si on n'a toujours pas 3 faux titres, combler
            while (chosenIncorrect.length < 3) {
                chosenIncorrect.push(`Album Alternatif ${chosenIncorrect.length + 1}`);
            }

            // Mélanger la bonne réponse et les fausses
            const options = shuffle([album.name, ...chosenIncorrect]);

            return {
                id: album.id,
                albumCover: album.albumCover,
                correctAnswer: album.name,
                options
            };
        });

        // Renvoyer les résultats
        res.json({
            artist: {
                id: artistId,
                name: artistName,
                image: artistImage
            },
            questions: questions.slice(0, 10)
        });

    } catch (err) {
        console.error("Erreur API GuessTheCover:", err);
        res.status(500).json({ error: "Erreur lors de la préparation du jeu Devine la Pochette." });
    }
});

module.exports = router;

