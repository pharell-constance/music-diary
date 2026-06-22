const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

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
