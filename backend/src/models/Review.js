const db = require('../config/db');

const Review = {
    async findUnique(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `Review` WHERE `id` = ?', [where.id]);
        if (rows.length === 0) return null;
        return await this._format(rows[0], options);
    },

    async findFirst(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Review`';
        let params = [];
        let whereParts = [];

        if (where.authorId !== undefined) {
            whereParts.push('`authorId` = ?');
            params.push(where.authorId);
        }
        if (where.spotifyAlbumId !== undefined) {
            whereParts.push('`spotifyAlbumId` = ?');
            params.push(where.spotifyAlbumId);
        }

        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }
        sql += ' LIMIT 1';

        const [rows] = await db.query(sql, params);
        if (rows.length === 0) return null;
        return await this._format(rows[0], options);
    },

    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Review`';
        let params = [];
        let whereParts = [];

        if (where.authorId !== undefined) {
            if (typeof where.authorId === 'object' && where.authorId.in !== undefined) {
                if (where.authorId.in.length > 0) {
                    const placeholders = where.authorId.in.map(() => '?').join(', ');
                    whereParts.push(`\`authorId\` IN (${placeholders})`);
                    params.push(...where.authorId.in);
                } else {
                    whereParts.push('1 = 0');
                }
            } else {
                whereParts.push('`authorId` = ?');
                params.push(where.authorId);
            }
        }
        if (where.spotifyAlbumId !== undefined) {
            whereParts.push('`spotifyAlbumId` = ?');
            params.push(where.spotifyAlbumId);
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

    async count() {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM `Review`');
        return rows[0].count;
    },

    async create(options = {}) {
        const data = options.data || {};
        const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const [result] = await db.query(`INSERT INTO \`Review\` (${columns}) VALUES (${placeholders})`, values);
        const [rows] = await db.query('SELECT * FROM `Review` WHERE `id` = ?', [result.insertId]);
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
        await db.query(`UPDATE \`Review\` SET ${setParts.join(', ')} WHERE \`id\` = ?`, values);

        const [rows] = await db.query('SELECT * FROM `Review` WHERE `id` = ?', [where.id]);
        return await this._format(rows[0], options);
    },

    async delete(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `Review` WHERE `id` = ?', [where.id]);
        const record = rows[0];

        await db.query('DELETE FROM `Review` WHERE `id` = ?', [where.id]);
        return record;
    },

    async deleteMany(options = {}) {
        const where = options.where || {};
        const [result] = await db.query('DELETE FROM `Review` WHERE `authorId` = ?', [where.authorId]);
        return { count: result.affectedRows };
    },

    async _format(row, options) {
        if (!row) return null;
        const formatted = { ...row };

        // Handle includes
        const include = options.include;
        if (include) {
            if (include.author) {
                const selectSpec = typeof include.author === 'object' ? include.author.select : null;
                const [authorRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.authorId]);
                let author = authorRows[0] || null;
                if (author && selectSpec) {
                    const filtered = {};
                    for (let key in selectSpec) {
                        if (selectSpec[key]) filtered[key] = author[key];
                    }
                    author = filtered;
                }
                formatted.author = author;
            }

            if (include.likes) {
                const [likeRows] = await db.query('SELECT * FROM `Like` WHERE `reviewId` = ?', [row.id]);
                formatted.likes = likeRows;
            }

            if (include.comments) {
                const [commentRows] = await db.query('SELECT * FROM `Comment` WHERE `reviewId` = ? ORDER BY `createdAt` ASC', [row.id]);
                
                const commentsWithUser = await Promise.all(commentRows.map(async comment => {
                    const userInclude = include.comments.include?.user;
                    const selectSpec = typeof userInclude === 'object' ? userInclude.select : null;
                    
                    const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [comment.userId]);
                    let user = userRows[0] || null;
                    if (user && selectSpec) {
                        const filtered = {};
                        for (let key in selectSpec) {
                            if (selectSpec[key]) filtered[key] = user[key];
                        }
                        user = filtered;
                    }
                    return {
                        ...comment,
                        user
                    };
                }));
                formatted.comments = commentsWithUser;
            }
        }

        return formatted;
    }
};

module.exports = Review;
