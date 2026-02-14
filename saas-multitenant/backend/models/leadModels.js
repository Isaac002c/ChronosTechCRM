const pool = require('../config/db');

// CREATE - Criar novo lead
const createLead = async ({ name, email, phone, company, status, source, tenant_id }) => {
    const result = await pool.query(
        `INSERT INTO leads(name, email, phone, company, status, source, tenant_id) 
         VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, email, phone, company, status || 'novo', source, tenant_id]
    );
    return result.rows[0];
};

// READ - Listar todos os leads do tenant
const getAllLeads = async (tenant_id) => {
    const result = await pool.query(
        'SELECT * FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC',
        [tenant_id]
    );
    return result.rows;
};

// READ - Buscar lead por ID
const getLeadById = async (id, tenant_id) => {
    const result = await pool.query(
        'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2',
        [id, tenant_id]
    );
    return result.rows[0];
};

// UPDATE - Atualizar lead
const updateLead = async (id, { name, email, phone, company, status, source }, tenant_id) => {
    const result = await pool.query(
        `UPDATE leads 
         SET name = $1, email = $2, phone = $3, company = $4, status = $5, source = $6, updated_at = NOW()
         WHERE id = $7 AND tenant_id = $8 RETURNING *`,
        [name, email, phone, company, status, source, id, tenant_id]
    );
    return result.rows[0];
};

// DELETE - Deletar lead
const deleteLead = async (id, tenant_id) => {
    const result = await pool.query(
        'DELETE FROM leads WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [id, tenant_id]
    );
    return result.rows[0];
};

// READ - Contar leads por status (para métricas)
const getLeadsCountByStatus = async (tenant_id) => {
    const result = await pool.query(
        `SELECT status, COUNT(*) as count 
         FROM leads WHERE tenant_id = $1 
         GROUP BY status`,
        [tenant_id]
    );
    return result.rows;
};

// READ - Contar leads por origem
const getLeadsCountBySource = async (tenant_id) => {
    const result = await pool.query(
        `SELECT source, COUNT(*) as count 
         FROM leads WHERE tenant_id = $1 
         GROUP BY source`,
        [tenant_id]
    );
    return result.rows;
};

module.exports = {
    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    deleteLead,
    getLeadsCountByStatus,
    getLeadsCountBySource
};

