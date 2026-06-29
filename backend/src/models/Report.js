const db = require('../config/db');

const Report = {
    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Report`';
        let params = [];
        let whereParts = [];

        if (where.resolved !== undefined) {
            whereParts.push('`resolved` = ?');
            params.push(where.resolved ? 1 : 0);
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

    async count(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT COUNT(*) as count FROM `Report`';
        let params = [];
        let whereParts = [];

        if (where.resolved !== undefined) {
            whereParts.push('`resolved` = ?');
            params.push(where.resolved ? 1 : 0);
        }

        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        const [rows] = await db.query(sql, params);
        return rows[0].count;
    },

    async create(options = {}) {
        const data = options.data || {};
        const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const [result] = await db.query(`INSERT INTO \`Report\` (${columns}) VALUES (${placeholders})`, values);
        const [rows] = await db.query('SELECT * FROM `Report` WHERE `id` = ?', [result.insertId]);
        return await this._format(rows[0], options);
    },

    async update(options = {}) {
        const where = options.where || {};
        const data = options.data || {};

        const setParts = [];
        const values = [];
        for (let k in data) {
            setParts.push(`\`${k}\` = ?`);
            values.push(data[k]);
        }

        values.push(where.id);
        await db.query(`UPDATE \`Report\` SET ${setParts.join(', ')} WHERE \`id\` = ?`, values);

        const [rows] = await db.query('SELECT * FROM `Report` WHERE `id` = ?', [where.id]);
        return await this._format(rows[0], options);
    },

    async delete(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `Report` WHERE `id` = ?', [where.id]);
        const record = rows[0];

        await db.query('DELETE FROM `Report` WHERE `id` = ?', [where.id]);
        return record;
    },

    async _format(row, options) {
        if (!row) return null;
        const formatted = { ...row };

        const include = options.include;
        if (include) {
            if (include.reporter) {
                const selectSpec = typeof include.reporter === 'object' ? include.reporter.select : null;
                const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.reporterId]);
                let user = userRows[0] || null;
                if (user && selectSpec) {
                    const filtered = {};
                    for (let key in selectSpec) {
                        if (selectSpec[key]) filtered[key] = user[key];
                    }
                    user = filtered;
                }
                formatted.reporter = user;
            }

            if (include.reportedUser) {
                const selectSpec = typeof include.reportedUser === 'object' ? include.reportedUser.select : null;
                const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.reportedUserId]);
                let user = userRows[0] || null;
                if (user && selectSpec) {
                    const filtered = {};
                    for (let key in selectSpec) {
                        if (selectSpec[key]) filtered[key] = user[key];
                    }
                    user = filtered;
                }
                formatted.reportedUser = user;
            }

            if (include.reportedReview) {
                const [reviewRows] = await db.query('SELECT * FROM `Review` WHERE `id` = ?', [row.reportedReviewId]);
                let review = reviewRows[0] || null;
                
                if (review) {
                    const reviewInclude = include.reportedReview.include;
                    if (reviewInclude && reviewInclude.author) {
                        const selectSpec = typeof reviewInclude.author === 'object' ? reviewInclude.author.select : null;
                        const [authorRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [review.authorId]);
                        let author = authorRows[0] || null;
                        if (author && selectSpec) {
                            const filtered = {};
                            for (let key in selectSpec) {
                                if (selectSpec[key]) filtered[key] = author[key];
                            }
                            author = filtered;
                        }
                        review.author = author;
                    }
                }
                formatted.reportedReview = review;
            }
        }

        return formatted;
    }
};

module.exports = Report;
