const db = require('../config/db');

const Like = {
    async findUnique(options = {}) {
        const where = options.where || {};
        const composite = where.userId_reviewId || {};
        const userId = composite.userId !== undefined ? composite.userId : where.userId;
        const reviewId = composite.reviewId !== undefined ? composite.reviewId : where.reviewId;
        
        const [rows] = await db.query('SELECT * FROM `Like` WHERE `userId` = ? AND `reviewId` = ?', [userId, reviewId]);
        return rows[0] || null;
    },

    async create(options = {}) {
        const data = options.data || {};
        await db.query('INSERT INTO `Like` (`userId`, `reviewId`) VALUES (?, ?)', [data.userId, data.reviewId]);
        const [rows] = await db.query('SELECT * FROM `Like` WHERE `userId` = ? AND `reviewId` = ?', [data.userId, data.reviewId]);
        return rows[0];
    },

    async delete(options = {}) {
        const where = options.where || {};
        const composite = where.userId_reviewId || {};
        const userId = composite.userId !== undefined ? composite.userId : where.userId;
        const reviewId = composite.reviewId !== undefined ? composite.reviewId : where.reviewId;

        const [rows] = await db.query('SELECT * FROM `Like` WHERE `userId` = ? AND `reviewId` = ?', [userId, reviewId]);
        const record = rows[0] || null;

        await db.query('DELETE FROM `Like` WHERE `userId` = ? AND `reviewId` = ?', [userId, reviewId]);
        return record;
    }
};

module.exports = Like;
