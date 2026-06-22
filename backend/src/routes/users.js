const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const {
    getSpotifyToken,
    getValidUserAccessToken,
    getWeeklyTopTracks,
    getArtistGenres
} = require('../services/spotifyService');

// Route pour modifier le profil utilisateur (Sécurisée)
router.put('/users/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pseudo, password, avatar, bio, statusEmoji, statusText, favArtistId, favArtistName, favArtistImage } = req.body;

        if (!pseudo) {
            return res.status(400).json({ error: "Le pseudo est obligatoire." });
        }

        const trimmedPseudo = pseudo.trim();
        if (trimmedPseudo.length < 3) {
            return res.status(400).json({ error: "Le pseudo doit comporter au moins 3 caractères" });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                pseudo: trimmedPseudo,
                NOT: { id: userId }
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Ce pseudo est déjà associé à un autre compte." });
        }

        const updateData = {
            pseudo: trimmedPseudo
        };

        if (avatar !== undefined) updateData.avatar = avatar;
        if (bio !== undefined) updateData.bio = bio;
        if (statusEmoji !== undefined) updateData.statusEmoji = statusEmoji;
        if (statusText !== undefined) updateData.statusText = statusText;
        if (favArtistId !== undefined) updateData.favArtistId = favArtistId;
        if (favArtistName !== undefined) updateData.favArtistName = favArtistName;
        if (favArtistImage !== undefined) updateData.favArtistImage = favArtistImage;

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

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

// Rechercher des utilisateurs
router.get('/users/search', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/profile', authenticateToken, async (req, res) => {
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

        const followersCount = await prisma.follows.count({
            where: { followingId: targetUserId }
        });

        const followingCount = await prisma.follows.count({
            where: { followerId: targetUserId }
        });

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
router.post('/users/:userId/follow', authenticateToken, async (req, res) => {
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
router.post('/users/:userId/unfollow', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/followers', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/following', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/reviews', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/recent', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/weekly-top', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/top-artists', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/top-tracks', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/top-albums', authenticateToken, async (req, res) => {
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
router.get('/users/:userId/spotify/top-genres', authenticateToken, async (req, res) => {
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

// Statut Spotify Live d'un utilisateur
router.get('/users/:userId/live', authenticateToken, async (req, res) => {
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

// Statistiques utilisateur & Analyses
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

// Suggérer des membres à suivre
router.get('/users/explore', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                isBanned: false
            },
            select: {
                id: true,
                pseudo: true,
                avatar: true,
                role: true,
                _count: {
                    select: { reviews: true, followers: true }
                }
            },
            take: 5
        });
        res.json(users);
    } catch (err) {
        console.error("Erreur get explore users:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des suggestions d'utilisateurs." });
    }
});

// Fil d'activité social (Critiques des abonnements)
router.get('/social/feed', authenticateToken, async (req, res) => {
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

module.exports = router;
