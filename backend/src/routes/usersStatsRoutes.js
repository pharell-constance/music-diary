const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const { getSpotifyToken } = require('../services/spotifyAuthService');
const { getArtistGenres } = require('../services/spotifyDataService');

router.get('/users/:userId/stats', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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

        const totalReviews = reviews.length;
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = parseFloat((totalRating / totalReviews).toFixed(1));

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            if (ratingDistribution[r.rating] !== undefined) {
                ratingDistribution[r.rating]++;
            }
        });

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

module.exports = router;
