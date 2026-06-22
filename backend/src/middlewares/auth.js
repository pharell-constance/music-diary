const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide ou expiré." });
        }

        // Live check if user is banned
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { isBanned: true, banReason: true }
            });
            if (dbUser && dbUser.isBanned) {
                return res.status(403).json({
                    error: `Compte suspendu`,
                    banReason: dbUser.banReason || "Non spécifié"
                });
            }
        } catch (dbErr) {
            console.error("Erreur vérification ban middleware:", dbErr);
        }

        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER')) {
        return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
