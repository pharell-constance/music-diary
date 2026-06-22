const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

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

module.exports = router;
