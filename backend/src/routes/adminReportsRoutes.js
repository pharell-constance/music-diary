const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

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

module.exports = router;
