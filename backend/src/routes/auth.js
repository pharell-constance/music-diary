const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Route d'inscription (Register)
router.post('/register', async (req, res) => {
    try {
        const { password, pseudo } = req.body;

        if (!password || !pseudo) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires" });
        }

        const trimmedPseudo = pseudo.trim();
        if (trimmedPseudo.length < 3) {
            return res.status(400).json({ error: "Le pseudo doit comporter au moins 3 caractères" });
        }

        const userExists = await prisma.user.findUnique({
            where: { pseudo: trimmedPseudo }
        });

        if (userExists) {
            return res.status(400).json({ error: "Ce pseudo est déjà utilisé" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                password: hashedPassword,
                pseudo: trimmedPseudo
            }
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès !",
            user: {
                id: newUser.id,
                pseudo: newUser.pseudo
            }
        });

    } catch (error) {
        console.error("Erreur inscription:", error);
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
});

// Route de Connexion (Login)
router.post('/login', async (req, res) => {
    try {
        const { pseudo, password } = req.body;

        if (!pseudo || !password) {
            return res.status(400).json({ error: "Pseudo et mot de passe obligatoires" });
        }

        const user = await prisma.user.findUnique({
            where: { pseudo: pseudo.trim() }
        });

        if (!user) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }

        if (user.isBanned) {
            return res.status(403).json({ error: `Votre compte a été suspendu de Music Diary. Motif : ${user.banReason || "Non spécifié"}` });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Connexion réussie !",
            token: token,
            user: {
                id: user.id,
                pseudo: user.pseudo,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error("Erreur login:", error);
        res.status(500).json({ error: "Erreur lors de la connexion" });
    }
});

module.exports = router;
