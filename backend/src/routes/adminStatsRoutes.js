const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalReviews = await prisma.review.count();

        const spotifyConnectedUsers = await prisma.user.count({
            where: {
                spotifyId: { not: null }
            }
        });

        const activeReports = await prisma.report.count({
            where: { resolved: false }
        });

        res.json({
            totalUsers,
            totalReviews,
            spotifyConnectedUsers,
            activeReports
        });
    } catch (err) {
        console.error('Erreur stats admin:', err);
        res.status(500).json({ error: 'Erreur lors du calcul des stats admin' });
    }
});

router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                pseudo: true,
                role: true,
                avatar: true,
                warningsCount: true,
                isBanned: true,
                banReason: true,
                _count: {
                    select: { reviews: true }
                }
            },
            orderBy: { id: 'asc' }
        });
        res.json(users);
    } catch (err) {
        console.error('Erreur users admin:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userIdToUpdate = parseInt(req.params.id);

        if (userIdToUpdate === req.user.userId) {
            return res.status(400).json({ error: "Action impossible. Vous ne pouvez pas révoquer vos propres droits d'administrateur." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdToUpdate }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas modifier le rôle du Propriétaire (Owner)." });
        }

        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';

        const updated = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: { role: newRole }
        });

        res.json({ message: `Le rôle de ${updated.pseudo} a été mis à jour en ${newRole}.`, user: updated });
    } catch (err) {
        console.error('Erreur rôle admin:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
    }
});

router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userIdToDelete = parseInt(req.params.id);

        if (userIdToDelete === req.user.userId) {
            return res.status(400).json({ error: "Action impossible. Vous ne pouvez pas supprimer votre propre compte." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdToDelete }
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas supprimer le compte du Propriétaire (Owner)." });
        }

        await prisma.review.deleteMany({
            where: { authorId: userIdToDelete }
        });

        await prisma.follows.deleteMany({
            where: {
                OR: [
                    { followerId: userIdToDelete },
                    { followingId: userIdToDelete }
                ]
            }
        });

        await prisma.user.delete({
            where: { id: userIdToDelete }
        });

        res.json({ message: `L'utilisateur ${user.pseudo} a été supprimé définitivement.` });
    } catch (err) {
        console.error('Erreur suppression user admin:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

router.get('/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        pseudo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (err) {
        console.error('Erreur reviews admin:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des critiques' });
    }
});

router.delete('/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({ error: "Critique introuvable" });
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        if (review.authorId !== req.user.userId) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: review.authorId,
                        type: "SYSTEM",
                        content: `Votre chronique de l'album "${review.albumName}" a été supprimée par l'administration.`
                    }
                });
            } catch (notifErr) {
                console.error("Erreur creation notification suppression critique:", notifErr);
            }
        }

        res.json({ message: "La critique a été supprimée avec succès." });
    } catch (err) {
        console.error('Erreur suppression review admin:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de la critique' });
    }
});

module.exports = router;
