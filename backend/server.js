require('dotenv').config();

function cleanEnv(value) {
    if (value == null || value === '') return value;
    return value.trim().replace(/^["']|["']$/g, '');
}

['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI', 'FRONTEND_URL', 'JWT_SECRET'].forEach((key) => {
    if (process.env[key]) process.env[key] = cleanEnv(process.env[key]);
});

const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/db');

async function ensureSpotifySchema() {
    const columns = await prisma.$queryRaw`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'User'
          AND COLUMN_NAME IN ('spotifyId', 'spotifyAccessToken', 'spotifyRefreshToken', 'spotifyTokenExpiresAt')
    `;
    const existing = new Set(columns.map((c) => c.COLUMN_NAME));

    if (!existing.has('spotifyId')) {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `spotifyId` VARCHAR(191) NULL');
    }
    if (!existing.has('spotifyAccessToken')) {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `spotifyAccessToken` TEXT NULL');
    } else {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` MODIFY COLUMN `spotifyAccessToken` TEXT NULL');
    }
    if (!existing.has('spotifyRefreshToken')) {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `spotifyRefreshToken` TEXT NULL');
    } else {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` MODIFY COLUMN `spotifyRefreshToken` TEXT NULL');
    }
    if (!existing.has('spotifyTokenExpiresAt')) {
        await prisma.$executeRawUnsafe('ALTER TABLE `User` ADD COLUMN `spotifyTokenExpiresAt` DATETIME(3) NULL');
    }
    console.log('Spotify DB columns OK');
}

const app = express();
app.use(express.json());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://music-diary.netlify.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean).map(url => url.trim().replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const cleanOrigin = origin.trim().replace(/\/$/, "");
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
        const isNetlify = cleanOrigin.endsWith('.netlify.app');

        if (allowedOrigins.includes(cleanOrigin) || isLocalhost || isNetlify) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejet de l'origine : ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
}));

// Route de test basique
app.get('/api/test', (req, res) => {
    res.json({ message: "Serveur opérationnel." });
});

// Enregistrement des sous-routeurs modularisés
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/spotify'));
app.use('/api', require('./src/routes/songs'));
app.use('/api', require('./src/routes/reviews'));
app.use('/api', require('./src/routes/users'));
app.use('/api', require('./src/routes/notifications'));
app.use('/api', require('./src/routes/admin'));

const PORT = process.env.PORT || 5001;
const DEFAULT_SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5001/api/spotify/callback';

async function startServer() {
    try {
        await ensureSpotifySchema();
    } catch (err) {
        console.error('ensureSpotifySchema failed:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`Le serveur tourne sur http://localhost:${PORT}`);
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || DEFAULT_SPOTIFY_REDIRECT_URI;
        console.log('Spotify redirect_uri:', redirectUri);
        if (process.env.SPOTIFY_CLIENT_ID) {
            console.log('Spotify client_id:', process.env.SPOTIFY_CLIENT_ID.slice(0, 8) + '...');
        } else {
            console.warn('SPOTIFY_CLIENT_ID non défini');
        }
        if (!process.env.SPOTIFY_CLIENT_SECRET) {
            console.warn('SPOTIFY_CLIENT_SECRET non défini');
        }
        if (redirectUri.includes('localhost')) {
            console.warn('Spotify n\'accepte plus localhost — utilisez http://127.0.0.1:PORT dans le dashboard et SPOTIFY_REDIRECT_URI');
        }
    });
}

startServer();