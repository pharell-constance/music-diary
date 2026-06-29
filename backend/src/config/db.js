const mysql = require('mysql2/promise');

// Parse DATABASE_URL if it contains double quotes
const databaseUrl = (process.env.DATABASE_URL || '').replace(/"/g, '');

const pool = mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cache for model instances
const models = {};

const db = {
    // raw query methods
    query: (...args) => pool.query(...args),
    execute: (...args) => pool.execute(...args),
    pool,
    
    // Prisma backward-compatibility methods
    async $queryRaw(strings, ...values) {
        const sql = strings.join('?');
        const [rows] = await pool.query(sql, values);
        return rows;
    },
    async $queryRawUnsafe(sql, ...values) {
        const [rows] = await pool.query(sql, values);
        return rows;
    },
    async $executeRawUnsafe(sql, ...values) {
        const [result] = await pool.query(sql, values);
        return result;
    },
    async $transaction(promises) {
        return await Promise.all(promises);
    },
    async $disconnect() {
        await pool.end();
    }
};

// Define getter properties for lowercase model names so they are loaded on-demand
const modelNames = ['User', 'Review', 'Follows', 'Report', 'Notification', 'Like', 'Comment', 'LyricPin'];
modelNames.forEach(name => {
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    Object.defineProperty(db, key, {
        get() {
            if (!models[name]) {
                models[name] = require(`../models/${name}`);
            }
            return models[name];
        },
        configurable: true,
        enumerable: true
    });
});

module.exports = db;
