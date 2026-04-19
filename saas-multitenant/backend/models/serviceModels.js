const pool = require('../config/db');

// READ - Listar serviços por cliente (agrupado de fines)
const getServicesByClient = async (client_id, tenant_id) => {
  const result = await pool.query(
    `SELECT 
      st.id::text AS id,
      st.code AS name,
      st.label,
      $1::uuid AS client_id,
      $2::text AS tenant_id,
      COUNT(f.id) AS total_fines,
      MAX(f.created_at) AS created_at,
      MAX(f.updated_at) AS updated_at
     FROM service_types st
     INNER JOIN fines f ON f.service_type_id = st.id
       AND f.client_id = $1
       AND f.tenant_id = $2
     GROUP BY st.id, st.code, st.label
     ORDER BY st.id`,
    [client_id, tenant_id]
  );
  return result.rows;
};

// READ - Buscar serviço por ID (service_type_id)
const getServiceById = async (id, tenant_id) => {
  const result = await pool.query(
    `SELECT 
      st.id::text AS id,
      st.code AS name,
      st.label
     FROM service_types st
     WHERE st.id = $1`,
    [id]
  );
  return result.rows[0];
};

// READ - Listar todos os serviços do tenant
const getAllServices = async (tenant_id) => {
  const result = await pool.query(
    `SELECT 
      st.id::text AS id,
      st.code AS name,
      st.label,
      c.id AS client_id,
      c.name AS client_name,
      c.cpf AS client_cpf,
      COUNT(f.id) AS total_fines,
      MAX(f.created_at) AS created_at
     FROM service_types st
     INNER JOIN fines f ON f.service_type_id = st.id AND f.tenant_id = $1
     INNER JOIN clients c ON f.client_id = c.id
     GROUP BY st.id, st.code, st.label, c.id, c.name, c.cpf
     ORDER BY MAX(f.created_at) DESC`,
    [tenant_id]
  );
  return result.rows;
};

// CREATE - Não aplicável (fines são criadas diretamente)
const createService = async ({ tenant_id, client_id, name }) => {
  throw new Error('Use a rota de fines para criar registros');
};

// DELETE - Deletar todas as fines de um service_type para um cliente
const deleteService = async (id, tenant_id) => {
  const result = await pool.query(
    `DELETE FROM fines 
     WHERE service_type_id = $1 AND tenant_id = $2 RETURNING *`,
    [id, tenant_id]
  );
  return result.rows[0];
};

const countServicesByClient = async (client_id, tenant_id) => {
  const result = await pool.query(
    `SELECT COUNT(DISTINCT service_type_id) as total 
     FROM fines 
     WHERE client_id = $1 AND tenant_id = $2`,
    [client_id, tenant_id]
  );
  return result.rows[0].total;
};

const updateService = async (id, { name }, tenant_id) => {
  return null;
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