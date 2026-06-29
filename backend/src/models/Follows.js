const db = require('../config/db');

const Follows = {
    async findUnique(options = {}) {
        const where = options.where || {};
        const composite = where.followerId_followingId || {};
        const followerId = composite.followerId !== undefined ? composite.followerId : where.followerId;
        const followingId = composite.followingId !== undefined ? composite.followingId : where.followingId;
        
        const [rows] = await db.query('SELECT * FROM `Follows` WHERE `followerId` = ? AND `followingId` = ?', [followerId, followingId]);
        if (rows.length === 0) return null;
        return await this._format(rows[0], options);
    },

    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Follows`';
        let params = [];
        let whereParts = [];

        if (where.followerId !== undefined) {
            whereParts.push('`followerId` = ?');
            params.push(where.followerId);
        }
        if (where.followingId !== undefined) {
            whereParts.push('`followingId` = ?');
            params.push(where.followingId);
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
        const formatted = await Promise.all(rows.map(row => this._format(row, options)));

        if (options.select) {
            formatted.forEach(item => {
                for (let k in item) {
                    if (!options.select[k]) delete item[k];
                }
            });
        }

        return formatted;
    },

    async count(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT COUNT(*) as count FROM `Follows`';
        let params = [];
        let whereParts = [];

        if (where.followerId !== undefined) {
            whereParts.push('`followerId` = ?');
            params.push(where.followerId);
        }
        if (where.followingId !== undefined) {
            whereParts.push('`followingId` = ?');
            params.push(where.followingId);
        }

        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        const [rows] = await db.query(sql, params);
        return rows[0].count;
    },

    async upsert(options = {}) {
        const where = options.where || {};
        const createData = options.create || {};
        
        const composite = where.followerId_followingId || {};
        const followerId = composite.followerId !== undefined ? composite.followerId : where.followerId;
        const followingId = composite.followingId !== undefined ? composite.followingId : where.followingId;
        
        const [rows] = await db.query('SELECT * FROM `Follows` WHERE `followerId` = ? AND `followingId` = ?', [followerId, followingId]);
        if (rows.length > 0) {
            return await this._format(rows[0], options);
        }
        
        await db.query('INSERT INTO `Follows` (`followerId`, `followingId`) VALUES (?, ?)', [createData.followerId, createData.followingId]);
        const [newRows] = await db.query('SELECT * FROM `Follows` WHERE `followerId` = ? AND `followingId` = ?', [createData.followerId, createData.followingId]);
        return await this._format(newRows[0], options);
    },

    async deleteMany(options = {}) {
        const where = options.where || {};
        let sql = 'DELETE FROM `Follows`';
        let params = [];
        
        if (where.OR && Array.isArray(where.OR)) {
            const orParts = [];
            for (let condition of where.OR) {
                const parts = [];
                for (let k in condition) {
                    parts.push(`\`${k}\` = ?`);
                    params.push(condition[k]);
                }
                if (parts.length > 0) orParts.push(`(${parts.join(' AND ')})`);
            }
            sql += ' WHERE ' + orParts.join(' OR ');
        } else {
            let whereParts = [];
            if (where.followerId !== undefined) {
                whereParts.push('`followerId` = ?');
                params.push(where.followerId);
            }
            if (where.followingId !== undefined) {
                whereParts.push('`followingId` = ?');
                params.push(where.followingId);
            }
            if (whereParts.length > 0) {
                sql += ' WHERE ' + whereParts.join(' AND ');
            }
        }

        const [result] = await db.query(sql, params);
        return { count: result.affectedRows };
    },

    async createMany(options = {}) {
        const data = options.data || [];
        if (data.length === 0) return { count: 0 };
        
        const valuePlaceholders = [];
        const values = [];
        for (let item of data) {
            valuePlaceholders.push('(?, ?, CURRENT_TIMESTAMP(3))');
            values.push(item.followerId, item.followingId);
        }
        
        const sql = `INSERT INTO \`Follows\` (\`followerId\`, \`followingId\`, \`createdAt\`) VALUES ${valuePlaceholders.join(', ')}`;
        const [result] = await db.query(sql, values);
        return { count: result.affectedRows };
    },

    async _format(row, options) {
        if (!row) return null;
        const formatted = { ...row };

        const include = options.include;
        if (include) {
            if (include.follower) {
                const selectSpec = typeof include.follower === 'object' ? include.follower.select : null;
                const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.followerId]);
                let user = userRows[0] || null;
                if (user && selectSpec) {
                    const filtered = {};
                    for (let key in selectSpec) {
                        if (selectSpec[key]) filtered[key] = user[key];
                    }
                    user = filtered;
                }
                formatted.follower = user;
            }

            if (include.following) {
                const selectSpec = typeof include.following === 'object' ? include.following.select : null;
                const [userRows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [row.followingId]);
                let user = userRows[0] || null;
                if (user && selectSpec) {
                    const filtered = {};
                    for (let key in selectSpec) {
                        if (selectSpec[key]) filtered[key] = user[key];
                    }
                    user = filtered;
                }
                formatted.following = user;
            }
        }

        return formatted;
    }
};

module.exports = Follows;
