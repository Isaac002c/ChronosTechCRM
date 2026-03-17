const pool = require('../config/db');

// ============================================
// SERVICES MODEL - Serviços do Cliente
// ============================================

// CREATE - Criar novo serviço
const createService = async ({ 
  tenant_id, client_id, name 
}) => {
  if (!tenant_id) {
    throw new Error('tenant_id é obrigatório para criar um serviço');
  }
  if (!client_id) {
    throw new Error('client_id é obrigatório para criar um serviço');
  }
  if (!name) {
    throw new Error('name é obrigatório para criar um serviço');
  }
  
  const result = await pool.query(
    `INSERT INTO services(tenant_id, client_id, name) 
     VALUES($1, $2, $3) RETURNING *`,
    [tenant_id, client_id, name]
  );
  
  return result.rows[0];
};

// READ - Listar todos os serviços do tenant
const getAllServices = async (tenant_id) => {
  const result = await pool.query(
    `SELECT s.*, c.name as client_name, c.cpf as client_cpf
     FROM services s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.tenant_id = $1
     ORDER BY s.created_at DESC`,
    [tenant_id]
  );
  return result.rows;
};

// READ - Listar serviços por cliente
const getServicesByClient = async (client_id, tenant_id) => {
  const result = await pool.query(
    `SELECT * FROM services 
     WHERE client_id = $1 AND tenant_id = $2
     ORDER BY created_at DESC`,
    [client_id, tenant_id]
  );
  return result.rows;
};

// READ - Buscar serviço por ID
const getServiceById = async (id, tenant_id) => {
  const result = await pool.query(
    `SELECT s.*, c.name as client_name, c.cpf as client_cpf, c.phone as client_phone, c.email as client_email
     FROM services s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.id = $1 AND s.tenant_id = $2`,
    [id, tenant_id]
  );
  return result.rows[0];
};

// READ - Contar serviços por cliente
const countServicesByClient = async (client_id, tenant_id) => {
  const result = await pool.query(
    'SELECT COUNT(*) as total FROM services WHERE client_id = $1 AND tenant_id = $2',
    [client_id, tenant_id]
  );
  return result.rows[0].total;
};

// UPDATE - Atualizar serviço
const updateService = async (id, { name }, tenant_id) => {
  const result = await pool.query(
    `UPDATE services 
     SET name = $1, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $3 RETURNING *`,
    [name, id, tenant_id]
  );
  return result.rows[0];
};

// DELETE - Deletar serviço
const deleteService = async (id, tenant_id) => {
  const result = await pool.query(
    'DELETE FROM services WHERE id = $1 AND tenant_id = $2 RETURNING *',
    [id, tenant_id]
  );
  return result.rows[0];
};

module.exports = {
  createService,
  getAllServices,
  getServicesByClient,
  getServiceById,
  countServicesByClient,
  updateService,
  deleteService
};

