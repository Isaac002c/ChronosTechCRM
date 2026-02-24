const pool = require('../config/db');

// CREATE - Criar novo lead
const createLead = async ({ name, email, phone, company, value, status, source, stage, tenant_id, seller_id }) => {
    // DEBUG: Log para identificar o problema
    console.log('[leadModels] createLead - dados recebidos:');
    console.log('  - name:', name);
    console.log('  - email:', email);
    console.log('  - tenant_id:', tenant_id, '(tipo:', typeof tenant_id, ')');
    console.log('  - seller_id:', seller_id);
    
    if (!tenant_id) {
        console.error('[leadModels] ERRO CRÍTICO: tenant_id está undefined ou null!');
        console.error('[leadModels] Dados completos:', { name, email, phone, company, value, status, source, stage, tenant_id, seller_id });
        throw new Error('tenant_id é obrigatório para criar um lead');
    }
    
    const result = await pool.query(
        `INSERT INTO leads(name, email, phone, company, value, status, source, stage, tenant_id, seller_id) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [name, email, phone, company, value || 0, status || 'novo', source, stage || 'lead', tenant_id, seller_id || null]
    );
    
    console.log('[leadModels] Lead criado com sucesso:', result.rows[0].id);
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
const updateLead = async (id, { name, email, phone, company, value, status, source, stage, seller_id }, tenant_id) => {
    const result = await pool.query(
        `UPDATE leads 
         SET name = $1, email = $2, phone = $3, company = $4, value = $5, status = $6, source = $7, stage = $8, seller_id = $9, updated_at = NOW()
         WHERE id = $10 AND tenant_id = $11 RETURNING *`,
        [name, email, phone, company, value, status, source, stage || 'lead', seller_id, id, tenant_id]
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
        `SELECT status, COUNT(*) as count, SUM(COALESCE(value, 0)) as total_value
         FROM leads WHERE tenant_id = $1 
         GROUP BY status`,
        [tenant_id]
    );
    return result.rows;
};

// READ - Contar leads por origem
const getLeadsCountBySource = async (tenant_id) => {
    const result = await pool.query(
        `SELECT source, COUNT(*) as count, SUM(COALESCE(value, 0)) as total_value
         FROM leads WHERE tenant_id = $1 
         GROUP BY source`,
        [tenant_id]
    );
    return result.rows;
};

// READ - Métricas financeiras do pipeline
const getPipelineMetrics = async (tenant_id) => {
    const result = await pool.query(
        `SELECT 
            COUNT(*) as total_leads,
            SUM(COALESCE(value, 0)) as total_pipeline_value,
            COUNT(CASE WHEN status = 'ganho' THEN 1 END) as gained_leads,
            SUM(CASE WHEN status = 'ganho' THEN COALESCE(value, 0) END) as total_revenue,
            COUNT(CASE WHEN status = 'novo' THEN 1 END) as new_leads,
            COUNT(CASE WHEN status = 'contactado' THEN 1 END) as contacted_leads,
            COUNT(CASE WHEN status = 'qualificado' THEN 1 END) as qualified_leads,
            COUNT(CASE WHEN status = 'proposta' THEN 1 END) as proposal_leads,
            COUNT(CASE WHEN status = 'negociacao' THEN 1 END) as negotiation_leads
         FROM leads WHERE tenant_id = $1 AND status NOT IN ('ganho', 'perdido')`,
        [tenant_id]
    );
    return result.rows[0];
};

// READ - Métricas mensais (para histórico)
const getMonthlyMetrics = async (tenant_id, months = 12) => {
    const result = await pool.query(
        `SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as total_leads,
            COUNT(CASE WHEN status = 'ganho' THEN 1 END) as gained_leads,
            SUM(CASE WHEN status = 'ganho' THEN COALESCE(value, 0) END) as revenue,
            SUM(COALESCE(value, 0)) as pipeline_value
         FROM leads 
         WHERE tenant_id = $1 
         AND created_at >= NOW() - INTERVAL '${months} months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month ASC`,
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
    getLeadsCountBySource,
    getPipelineMetrics,
    getMonthlyMetrics
};

