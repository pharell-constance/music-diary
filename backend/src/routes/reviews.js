const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const { getSpotifyToken } = require('../services/spotifyService');

// Route pour créer une critique (Sécurisée)
router.post('/reviews', authenticateToken, async (req, res) => {
    try {
        const { content, rating, spotifyAlbumId, albumName, artistName, albumCover } = req.body;
        const authorId = req.user.userId;

        if (!content || !rating || !spotifyAlbumId) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "La note doit être comprise entre 1 et 5." });
        }

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

        // Migration à la volée (fallback) pour les anciennes critiques sans métadonnées d'album
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

                            review.albumName = name;
                            review.albumCover = cover;
                            review.artistName = artists;

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

router.get('/reviews', authenticateToken, getUserReviews);
router.get('/reviews/me', authenticateToken, getUserReviews);

// Route pour supprimer une critique (Sécurisée)
router.delete('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.user.userId;

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable." });
        }

        if (review.authorId !== userId) {
            return res.status(403).json({ error: "Vous n'avez pas l'autorisation de supprimer cette critique." });
        }

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
router.put('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const userId = req.user.userId;
        const { content, rating } = req.body;

        if (!content || !rating) {
            return res.status(400).json({ error: "Le contenu et la note sont obligatoires." });
        }

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable." });
        }

        if (review.authorId !== userId) {
            return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier cette critique." });
        }

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

// Explorer les critiques publiques (toutes récentes)
router.get('/reviews/explore', authenticateToken, async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            take: 10,
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
        console.error("Erreur get explore reviews:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des critiques d'exploration." });
    }
});

// Aimer une critique
router.post('/reviews/:reviewId/like', authenticateToken, async (req, res) => {
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

// Ne plus aimer une critique
router.delete('/reviews/:reviewId/like', authenticateToken, async (req, res) => {
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

// Commenter une critique
router.post('/reviews/:reviewId/comments', authenticateToken, async (req, res) => {
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

// Récupérer les commentaires d'une critique
router.get('/reviews/:reviewId/comments', authenticateToken, async (req, res) => {
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

// Supprimer un commentaire
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
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

module.exports = router;
