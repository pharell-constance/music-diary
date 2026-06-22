const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

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
