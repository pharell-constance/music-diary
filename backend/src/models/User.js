const db = require('../config/db');

const User = {
    // 1. findUnique
    async findUnique(options = {}) {
        const where = options.where || {};
        let row;
        if (where.id !== undefined) {
            const [rows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [where.id]);
            row = rows[0];
        } else if (where.pseudo !== undefined) {
            const [rows] = await db.query('SELECT * FROM `User` WHERE `pseudo` = ?', [where.pseudo]);
            row = rows[0];
        }
        
        if (!row) return null;
        return this._format(row, options);
    },
    
    // 2. findFirst
    async findFirst(options = {}) {
        const where = options.where || {};
        let rows = [];
        
        if (where.pseudo !== undefined && where.NOT && where.NOT.id !== undefined) {
            // Profile pseudo unique check
            const [res] = await db.query('SELECT * FROM `User` WHERE `pseudo` = ? AND `id` != ? LIMIT 1', [where.pseudo, where.NOT.id]);
            rows = res;
        } else if (where.favArtistId !== undefined) {
            // Artist details fallback
            const [res] = await db.query('SELECT * FROM `User` WHERE `favArtistId` = ? LIMIT 1', [where.favArtistId]);
            rows = res;
        } else {
            const [res] = await db.query('SELECT * FROM `User` LIMIT 1');
            rows = res;
        }
        
        if (rows.length === 0) return null;
        return this._format(rows[0], options);
    },
    
    // 3. findMany
    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `User`';
        let params = [];
        let whereParts = [];
        
        if (where.id && where.id.not !== undefined) {
            whereParts.push('`id` != ?');
            params.push(where.id.not);
        }
        if (where.isBanned !== undefined) {
            whereParts.push('`isBanned` = ?');
            params.push(where.isBanned ? 1 : 0);
        }
        if (where.pseudo && where.pseudo.contains !== undefined) {
            whereParts.push('`pseudo` LIKE ?');
            params.push(`%${where.pseudo.contains}%`);
        }
        
        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }
        
        if (options.orderBy) {
            const orderByField = Object.keys(options.orderBy)[0];
            const orderByDir = options.orderBy[orderByField].toUpperCase();
            sql += ` ORDER BY \`${orderByField}\` ${orderByDir}`;
        }
        
        if (options.take !== undefined) {
            sql += ` LIMIT ${parseInt(options.take)}`;
        }
        
        const [rows] = await db.query(sql, params);
        
        return await Promise.all(rows.map(row => this._format(row, options)));
    },
    
    // 4. count
    async count(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT COUNT(*) as count FROM `User`';
        let params = [];
        
        if (where.spotifyId && where.spotifyId.not === null) {
            sql += ' WHERE `spotifyId` IS NOT NULL';
        }
        
        const [rows] = await db.query(sql, params);
        return rows[0].count;
    },
    
    // 5. create
    async create(options = {}) {
        const data = options.data || {};
        const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const [result] = await db.query(`INSERT INTO \`User\` (${columns}) VALUES (${placeholders})`, values);
        
        const [rows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [result.insertId]);
        return this._format(rows[0], options);
    },
    
    // 6. update
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
        await db.query(`UPDATE \`User\` SET ${setParts.join(', ')} WHERE \`id\` = ?`, values);
        
        const [rows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [where.id]);
        return this._format(rows[0], options);
    },
    
    // 7. delete
    async delete(options = {}) {
        const where = options.where || {};
        const [rows] = await db.query('SELECT * FROM `User` WHERE `id` = ?', [where.id]);
        const record = rows[0];
        
        await db.query('DELETE FROM `User` WHERE `id` = ?', [where.id]);
        return record;
    },
    
    // Helper to format output (select & _count)
    async _format(row, options) {
        if (!row) return null;
        
        const formatted = { ...row };
        
        // Handle _count
        const select = options.select;
        if (select && select._count) {
            formatted._count = {};
            const countSpec = select._count.select || select._count;
            if (countSpec.reviews) {
                const [rows] = await db.query('SELECT COUNT(*) as count FROM `Review` WHERE `authorId` = ?', [row.id]);
                formatted._count.reviews = rows[0].count;
            }
            if (countSpec.followers) {
                const [rows] = await db.query('SELECT COUNT(*) as count FROM `Follows` WHERE `followingId` = ?', [row.id]);
                formatted._count.followers = rows[0].count;
            }
        }
        
        // Handle select filtering
        if (select) {
            for (let key in formatted) {
                if (key === '_count') continue;
                if (!select[key]) {
                    delete formatted[key];
                }
            }
        }
        
        return formatted;
    }
};

module.exports = User;
