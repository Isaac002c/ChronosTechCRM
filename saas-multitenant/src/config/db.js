const { Pool } = require('pg');
require('dotenv').config();

console.log('DATABASE_URL =>', process.env.DATABASE_URL);
console.log('TYPE =>', typeof process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log(' Supabase conectado! Hora do servidor:', res.rows[0]);
    } catch (err) {
        console.error(' Erro ao conectar no Supabase:', err.message);
    }
})();

module.exports = pool;
