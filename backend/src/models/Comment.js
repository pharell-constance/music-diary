const db = require('../config/db');

const Comment = {
    async findUnique(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `Comment` WHERE `id` = ?', [where.id]);
        if (rows.length === 0) return null;
        return await this._format(rows[0], options);
    },

    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Comment`';
        let params = [];
        let whereParts = [];

        if (where.reviewId !== undefined) {
            whereParts.push('`reviewId` = ?');
            params.push(where.reviewId);
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
        return await Promise.all(rows.map(row => this._format(row, options)));
    },

    async create(options = {}) {
        const data = options.data || {};
        const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const [result] = await db.query(`INSERT INTO \`Comment\` (${columns}) VALUES (${placeholders})`, values);
        const [rows] = await db.query('SELECT * FROM `Comment` WHERE `id` = ?', [result.insertId]);
        return await this._format(rows[0], options);
    },

    async delete(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `Comment` WHERE `id` = ?', [where.id]);
        const record = rows[0] || null;

        await db.query('DELETE FROM `Comment` WHERE `id` = ?', [where.id]);
        return record;
    },

    async _format(row, options) {
        if (!row) return null;
        const formatted = { ...row };

        const include = options.include;
        if (include && include.user) {
            const selectSpec = typeof include.user === 'object' ? include.user.select : null;
            const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.userId]);
            let user = userRows[0] || null;
            if (user && selectSpec) {
                const filtered = {};
                for (let key in selectSpec) {
                    if (selectSpec[key]) filtered[key] = user[key];
                }
                user = filtered;
            }
            formatted.user = user;
        }

        return formatted;
    }
};

module.exports = Comment;
