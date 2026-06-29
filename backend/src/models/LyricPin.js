const db = require('../config/db');

const LyricPin = {
    async findUnique(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `LyricPin` WHERE `id` = ?', [where.id]);
        if (rows.length === 0) return null;
        return rows[0];
    },

    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `LyricPin`';
        let params = [];
        let whereParts = [];

        if (where.authorId !== undefined) {
            whereParts.push('`authorId` = ?');
            params.push(where.authorId);
        }

        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        if (options.orderBy) {
            const orderByField = Object.keys(options.orderBy)[0];
            const orderByDir = options.orderBy[orderByField].toUpperCase();
            sql += ` ORDER BY \`${orderByField}\` ${orderByDir}`;
        }

        const [rows] = await db.query(sql, params);
        return rows;
    },

    async create(options = {}) {
        const data = options.data || {};
        const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const [result] = await db.query(`INSERT INTO \`LyricPin\` (${columns}) VALUES (${placeholders})`, values);
        const [rows] = await db.query('SELECT * FROM `LyricPin` WHERE `id` = ?', [result.insertId]);
        return rows[0];
    },

    async delete(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `LyricPin` WHERE `id` = ?', [where.id]);
        const record = rows[0] || null;

        await db.query('DELETE FROM `LyricPin` WHERE `id` = ?', [where.id]);
        return record;
    }
};

module.exports = LyricPin;
