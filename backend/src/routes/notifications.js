const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

// 1. Récupérer toutes les notifications d'un utilisateur
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        console.error("Erreur get notifications:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des notifications." });
    }
});

// 2. Récupérer le nombre de notifications non lues
router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.user.userId,
                read: false
            }
        });
        res.json({ count });
    } catch (err) {
        console.error("Erreur get unread count:", err);
        res.status(500).json({ error: "Erreur lors du comptage des notifications non lues." });
    }
});

// 3. Marquer toutes les notifications comme lues
router.put('/notifications/read', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.userId },
            data: { read: true }
        });
        res.json({ message: "Toutes les notifications ont été marquées comme lues." });
    } catch (err) {
        console.error("Erreur read all notifications:", err);
        res.status(500).json({ error: "Erreur lors du marquage des notifications." });
    }
});

// 4. Marquer une notification spécifique comme lue
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        const updated = await prisma.notification.update({
            where: {
                id: notifId,
                userId: req.user.userId
            },
            data: { read: true }
        });
        res.json({ message: "Notification marquée comme lue.", notification: updated });
    } catch (err) {
        console.error("Erreur read notification:", err);
        res.status(500).json({ error: "Erreur lors du marquage de la notification." });
    }
});

// 5. Supprimer une notification spécifique
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        await prisma.notification.delete({
            where: {
                id: notifId,
                userId: req.user.userId
            }
        });
        res.json({ message: "Notification supprimée." });
    } catch (err) {
        console.error("Erreur delete notification:", err);
        res.status(500).json({ error: "Erreur lors de la suppression de la notification." });
    }
});

// 6. Tout supprimer les notifications d'un utilisateur
router.delete('/notifications', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: { userId: req.user.userId }
        });
        res.json({ message: "Toutes les notifications ont été supprimées." });
    } catch (err) {
        console.error("Erreur delete all notifications:", err);
        res.status(500).json({ error: "Erreur lors de la suppression des notifications." });
    }
});

module.exports = router;
