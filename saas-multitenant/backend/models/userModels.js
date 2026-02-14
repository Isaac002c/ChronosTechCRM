const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async ({ name, email, password, tenant_id }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users(name, email, password_hash, tenant_id) VALUES($1,$2,$3,$4) RETURNING *',
        [name, email, hashedPassword, tenant_id]
    );
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    return result.rows[0];
};

module.exports = {
    createUser,
    getUserByEmail,
};
