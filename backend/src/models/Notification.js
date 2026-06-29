const db = require('../config/db');

const Notification = {
    async findMany(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT * FROM `Notification`';
        let params = [];
        let whereParts = [];

        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            params.push(where.userId);
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

    async count(options = {}) {
        const where = options.where || {};
        let sql = 'SELECT COUNT(*) as count FROM `Notification`';
        let params = [];
        let whereParts = [];

        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            params.push(where.userId);
        }
        if (where.read !== undefined) {
            whereParts.push('`read` = ?');
            params.push(where.read ? 1 : 0);
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

        const [result] = await db.query(`INSERT INTO \`Notification\` (${columns}) VALUES (${placeholders})`, values);
        const [rows] = await db.query('SELECT * FROM `Notification` WHERE `id` = ?', [result.insertId]);
        return rows[0];
    },

    async createMany(options = {}) {
        const data = options.data || [];
        if (data.length === 0) return { count: 0 };

        const valuePlaceholders = [];
        const values = [];
        for (let item of data) {
            valuePlaceholders.push('(?, ?, ?, ?, CURRENT_TIMESTAMP(3))');
            values.push(item.type, item.content, item.read ? 1 : 0, item.userId);
        }

        const sql = `INSERT INTO \`Notification\` (\`type\`, \`content\`, \`read\`, \`userId\`, \`createdAt\`) VALUES ${valuePlaceholders.join(', ')}`;
        const [result] = await db.query(sql, values);
        return { count: result.affectedRows };
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

        let sql = `UPDATE \`Notification\` SET ${setParts.join(', ')}`;
        let whereParts = [];
        if (where.id !== undefined) {
            whereParts.push('`id` = ?');
            values.push(where.id);
        }
        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            values.push(where.userId);
        }
        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        await db.query(sql, values);

        let selectSql = 'SELECT * FROM `Notification` WHERE ';
        let selectParts = [];
        let selectParams = [];
        if (where.id !== undefined) {
            selectParts.push('`id` = ?');
            selectParams.push(where.id);
        }
        if (where.userId !== undefined) {
            selectParts.push('`userId` = ?');
            selectParams.push(where.userId);
        }
        const [rows] = await db.query(selectSql + selectParts.join(' AND '), selectParams);
        return rows[0] || null;
    },

    async updateMany(options = {}) {
        const where = options.where || {};
        const data = options.data || {};

        const setParts = [];
        const values = [];
        for (let k in data) {
            setParts.push(`\`${k}\` = ?`);
            values.push(data[k]);
        }

        let sql = `UPDATE \`Notification\` SET ${setParts.join(', ')}`;
        let whereParts = [];
        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            values.push(where.userId);
        }
        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        const [result] = await db.query(sql, values);
        return { count: result.affectedRows };
    },

    async delete(options = {}) {
        const where = options.where || {};
        let params = [];
        let whereParts = [];

        if (where.id !== undefined) {
            whereParts.push('`id` = ?');
            params.push(where.id);
        }
        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            params.push(where.userId);
        }

        const [rows] = await db.query('SELECT * FROM `Notification` WHERE ' + whereParts.join(' AND '), params);
        const record = rows[0] || null;

        await db.query('DELETE FROM `Notification` WHERE ' + whereParts.join(' AND '), params);
        return record;
    },

    async deleteMany(options = {}) {
        const where = options.where || {};
        let sql = 'DELETE FROM `Notification`';
        let params = [];
        let whereParts = [];

        if (where.userId !== undefined) {
            whereParts.push('`userId` = ?');
            params.push(where.userId);
        }

        if (whereParts.length > 0) {
            sql += ' WHERE ' + whereParts.join(' AND ');
        }

        const [result] = await db.query(sql, params);
        return { count: result.affectedRows };
    }
};

module.exports = Notification;
