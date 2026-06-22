const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, requireRegularUser } = require('../middlewares/auth');

router.get('/lyric-pins', authenticateToken, async (req, res) => {
    try {
        const pins = await prisma.lyricPin.findMany({
            where: { authorId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pins);
    } catch (err) {
        console.error('Erreur lyric-pins GET:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/users/:userId/lyric-pins', authenticateToken, async (req, res) => {
    try {
        const pins = await prisma.lyricPin.findMany({
            where: { authorId: parseInt(req.params.userId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pins);
    } catch (err) {
        console.error('Erreur lyric-pins GET user:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/lyric-pins', authenticateToken, requireRegularUser, async (req, res) => {
    try {
        const { lyric, trackName, artistName, albumCover, color } = req.body;
        if (!lyric || !trackName || !artistName) {
            return res.status(400).json({ error: 'Paroles, titre et artiste sont requis.' });
        }
        const pin = await prisma.lyricPin.create({
            data: {
                lyric,
                trackName,
                artistName,
                albumCover: albumCover || null,
                color: color || '#1DB954',
                authorId: req.user.userId
            }
        });
        res.status(201).json(pin);
    } catch (err) {
        console.error('Erreur lyric-pins POST:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/lyric-pins/:id', authenticateToken, async (req, res) => {
    try {
        const pin = await prisma.lyricPin.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!pin) return res.status(404).json({ error: 'Pin non trouvé.' });
        if (pin.authorId !== req.user.userId) return res.status(403).json({ error: 'Interdit.' });
        await prisma.lyricPin.delete({ where: { id: pin.id } });
        res.json({ message: 'Pin supprimé.' });
    } catch (err) {
        console.error('Erreur lyric-pins DELETE:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
