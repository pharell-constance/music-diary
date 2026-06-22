const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

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
