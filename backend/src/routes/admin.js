const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// 1. Stats d'administration
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

// 2. Récupérer tous les utilisateurs
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

// 3. Basculer le rôle d'un utilisateur (USER <-> ADMIN)
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

// 4. Supprimer un utilisateur
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

// 5. Récupérer toutes les critiques
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

// 6. Supprimer une critique
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

// --- REPORTS ---

// 1. Soumettre un signalement (Utilisateur connecté)
router.post('/reports', authenticateToken, async (req, res) => {
    try {
        const { reason, reportedReviewId, reportedUserId } = req.body;
        const reporterId = req.user.userId;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: "Veuillez fournir une raison pour le signalement." });
        }

        if (!reportedReviewId && !reportedUserId) {
            return res.status(400).json({ error: "Veuillez spécifier le contenu ou le membre à signaler." });
        }

        const newReport = await prisma.report.create({
            data: {
                reason: reason.trim(),
                reporterId,
                reportedReviewId: reportedReviewId ? parseInt(reportedReviewId) : null,
                reportedUserId: reportedUserId ? parseInt(reportedUserId) : null
            }
        });

        res.json({ message: "Signalement enregistré avec succès. Un administrateur l'analysera rapidement.", report: newReport });
    } catch (err) {
        console.error("Erreur creation report:", err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du signalement." });
    }
});

// 2. Récupérer les signalements non résolus (Admin uniquement)
router.get('/admin/reports', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { resolved: false },
            include: {
                reporter: {
                    select: { id: true, pseudo: true }
                },
                reportedReview: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                pseudo: true,
                                warningsCount: true,
                                isBanned: true,
                                banReason: true
                            }
                        }
                    }
                },
                reportedUser: {
                    select: {
                        id: true,
                        pseudo: true,
                        warningsCount: true,
                        isBanned: true,
                        banReason: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (err) {
        console.error("Erreur get admin reports:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des signalements." });
    }
});

// 3. Résoudre un signalement (Admin uniquement)
router.put('/admin/reports/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { resolved: true }
        });
        res.json({ message: "Le signalement a été marqué comme traité.", report: updated });
    } catch (err) {
        console.error("Erreur resolve report:", err);
        res.status(500).json({ error: "Erreur lors de la résolution du signalement." });
    }
});

// 4. Supprimer un signalement (Admin uniquement)
router.delete('/admin/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        await prisma.report.delete({
            where: { id: reportId }
        });
        res.json({ message: "Le signalement a été supprimé." });
    } catch (err) {
        console.error("Erreur delete report:", err);
        res.status(500).json({ error: "Erreur lors de la suppression du signalement." });
    }
});

// 5. Sanctions : Avertissement
router.put('/admin/users/:id/warn', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);

        if (targetUserId === req.user.userId) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous envoyer d'avertissement." });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas envoyer d'avertissement au Propriétaire (Owner)." });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { warningsCount: { increment: 1 } }
        });

        try {
            await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: "WARNING",
                    content: `Vous avez reçu un avertissement officiel de l'administration. Total d'avertissements : ${updated.warningsCount}.`
                }
            });
        } catch (notifErr) {
            console.error("Erreur creation notification avertissement:", notifErr);
        }

        res.json({
            message: `Avertissement envoyé à ${updated.pseudo}. Total d'avertissements : ${updated.warningsCount}.`,
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur warn user:", err);
        res.status(500).json({ error: "Erreur lors de l'avertissement de l'utilisateur." });
    }
});

// 6. Sanctions : Bannissement
router.put('/admin/users/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const { reason } = req.body;

        if (targetUserId === req.user.userId) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous bannir vous-même." });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ error: "Action impossible. Vous ne pouvez pas bannir le Propriétaire (Owner)." });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBanned: true,
                banReason: reason || "Non respect des conditions d'utilisation."
            }
        });

        res.json({
            message: `L'utilisateur ${updated.pseudo} a été banni avec succès.`,
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur ban user:", err);
        res.status(500).json({ error: "Erreur lors du bannissement de l'utilisateur." });
    }
});

// 7. Sanctions : Débannissement
router.put('/admin/users/:id/unban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBanned: false,
                banReason: null
            }
        });

        res.json({
            message: `L'utilisateur ${updated.pseudo} a été débanni.`,
            user: {
                id: updated.id,
                pseudo: updated.pseudo,
                warningsCount: updated.warningsCount,
                isBanned: updated.isBanned,
                banReason: updated.banReason
            }
        });
    } catch (err) {
        console.error("Erreur unban user:", err);
        res.status(500).json({ error: "Erreur lors du débannissement de l'utilisateur." });
    }
});

module.exports = router;
