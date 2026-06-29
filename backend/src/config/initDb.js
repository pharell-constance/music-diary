const db = require('./db');

async function initDb() {
    console.log("⏳ Initializing database tables...");
    
    // Disable foreign key checks while creating tables
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. User
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`User\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`password\` VARCHAR(255) NOT NULL,
            \`pseudo\` VARCHAR(191) NOT NULL,
            \`role\` VARCHAR(50) NOT NULL DEFAULT 'USER',
            \`spotifyId\` VARCHAR(191) NULL,
            \`spotifyAccessToken\` TEXT NULL,
            \`spotifyRefreshToken\` TEXT NULL,
            \`spotifyTokenExpiresAt\` DATETIME(3) NULL,
            \`avatar\` LONGTEXT NULL,
            \`bio\` TEXT NULL,
            \`statusEmoji\` VARCHAR(50) NULL,
            \`statusText\` VARCHAR(255) NULL,
            \`favArtistId\` VARCHAR(191) NULL,
            \`favArtistName\` VARCHAR(255) NULL,
            \`favArtistImage\` VARCHAR(255) NULL,
            \`warningsCount\` INTEGER NOT NULL DEFAULT 0,
            \`isBanned\` BOOLEAN NOT NULL DEFAULT FALSE,
            \`banReason\` VARCHAR(255) NULL,
            UNIQUE INDEX \`User_pseudo_key\`(\`pseudo\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 2. Review
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Review\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`content\` TEXT NOT NULL,
            \`rating\` INTEGER NOT NULL,
            \`spotifyAlbumId\` VARCHAR(191) NOT NULL,
            \`albumName\` VARCHAR(255) NOT NULL DEFAULT '',
            \`artistName\` VARCHAR(255) NOT NULL DEFAULT '',
            \`albumCover\` VARCHAR(255) NOT NULL DEFAULT '',
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`authorId\` INTEGER NOT NULL,
            PRIMARY KEY (\`id\`),
            CONSTRAINT \`Review_authorId_fkey\` FOREIGN KEY (\`authorId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 3. Follows
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Follows\` (
            \`followerId\` INTEGER NOT NULL,
            \`followingId\` INTEGER NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (\`followerId\`, \`followingId\`),
            CONSTRAINT \`Follows_followerId_fkey\` FOREIGN KEY (\`followerId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT \`Follows_followingId_fkey\` FOREIGN KEY (\`followingId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 4. Report
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Report\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`reason\` TEXT NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`resolved\` BOOLEAN NOT NULL DEFAULT FALSE,
            \`reporterId\` INTEGER NOT NULL,
            \`reportedReviewId\` INTEGER NULL,
            \`reportedUserId\` INTEGER NULL,
            PRIMARY KEY (\`id\`),
            CONSTRAINT \`Report_reporterId_fkey\` FOREIGN KEY (\`reporterId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT \`Report_reportedReviewId_fkey\` FOREIGN KEY (\`reportedReviewId\`) REFERENCES \`Review\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT \`Report_reportedUserId_fkey\` FOREIGN KEY (\`reportedUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 5. Notification
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Notification\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`type\` VARCHAR(50) NOT NULL,
            \`content\` TEXT NOT NULL,
            \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`userId\` INTEGER NOT NULL,
            PRIMARY KEY (\`id\`),
            CONSTRAINT \`Notification_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 6. Like
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Like\` (
            \`userId\` INTEGER NOT NULL,
            \`reviewId\` INTEGER NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (\`userId\`, \`reviewId\`),
            CONSTRAINT \`Like_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT \`Like_reviewId_fkey\` FOREIGN KEY (\`reviewId\`) REFERENCES \`Review\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 7. Comment
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`Comment\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`content\` TEXT NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`userId\` INTEGER NOT NULL,
            \`reviewId\` INTEGER NOT NULL,
            PRIMARY KEY (\`id\`),
            CONSTRAINT \`Comment_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT \`Comment_reviewId_fkey\` FOREIGN KEY (\`reviewId\`) REFERENCES \`Review\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 8. LyricPin
    await db.query(`
        CREATE TABLE IF NOT EXISTS \`LyricPin\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`lyric\` TEXT NOT NULL,
            \`trackName\` VARCHAR(255) NOT NULL,
            \`artistName\` VARCHAR(255) NOT NULL,
            \`albumCover\` VARCHAR(255) NULL,
            \`color\` VARCHAR(50) NOT NULL DEFAULT '#1DB954',
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`authorId\` INTEGER NOT NULL,
            PRIMARY KEY (\`id\`),
            CONSTRAINT \`LyricPin_authorId_fkey\` FOREIGN KEY (\`authorId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Enable foreign key checks back
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("✅ Database initialized successfully!");
}

module.exports = initDb;
