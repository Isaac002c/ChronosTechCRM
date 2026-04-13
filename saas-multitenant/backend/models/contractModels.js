const pool = require('../config/db');

const toDateOrNull = (v) => (v === '' || v == null) ? null : v;

const createContract = async ({ 
  tenant_id, client_id, service_id, organ, process_number, contract_number,
  infraction_type, vehicle_plate, vehicle_model, status, value, 
  due_date, notes, numero_multa, deadline_date 
}) => {
  if (!tenant_id) throw new Error('tenant_id e obrigatorio');
  if (!client_id) throw new Error('client_id e obrigatorio');
  const result = await pool.query(
    `INSERT INTO contracts(
      tenant_id, client_id, service_id, organ, process_number, contract_number,
      infraction_type, vehicle_plate, vehicle_model, status, value, 
      due_date, notes, numero_multa, deadline_date
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      tenant_id, client_id, service_id, organ, process_number, contract_number,
      infraction_type, vehicle_plate, vehicle_model, status || 'ativo', value || 0,
      toDateOrNull(due_date), notes, numero_multa, toDateOrNull(deadline_date)
    ]
  );
  return result.rows[0];
};

const getAllContracts = async (tenant_id) => {
  const result = await pool.query(
    `SELECT c.*, cl.name as client_name, cl.cpf as client_cpf, cl.phone as client_phone, s.name as service_name
     FROM contracts c
     LEFT JOIN clients cl ON c.client_id = cl.id
     LEFT JOIN services s ON c.service_id = s.id
     WHERE c.tenant_id = $1 ORDER BY c.created_at DESC`,
    [tenant_id]
  );
  return result.rows;
};

const getContractsByFilter = async (tenant_id, filters = {}) => {
  let query = `
    SELECT c.*, cl.name as client_name, cl.cpf as client_cpf, cl.phone as client_phone, s.name as service_name
    FROM contracts c
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN services s ON c.service_id = s.id
    WHERE c.tenant_id = $1
  `;
  const params = [tenant_id];
  let i = 2;
  if (filters.client_id)     { query += ` AND c.client_id = $${i}`;           params.push(filters.client_id); i++; }
  if (filters.status)        { query += ` AND c.status = $${i}`;               params.push(filters.status); i++; }
  if (filters.organ)         { query += ` AND c.organ ILIKE $${i}`;            params.push(`%${filters.organ}%`); i++; }
  if (filters.vehicle_plate) { query += ` AND c.vehicle_plate ILIKE $${i}`;   params.push(`%${filters.vehicle_plate}%`); i++; }
  query += ' ORDER BY c.created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getContractById = async (id, tenant_id) => {
  const result = await pool.query(
    `SELECT c.*, cl.name as client_name, cl.cpf as client_cpf, cl.phone as client_phone, cl.email as client_email, s.name as service_name
     FROM contracts c
     LEFT JOIN clients cl ON c.client_id = cl.id
     LEFT JOIN services s ON c.service_id = s.id
     WHERE c.id = $1 AND c.tenant_id = $2`,
    [id, tenant_id]
  );
  return result.rows[0];
};

const getContractsByClient = async (client_id, tenant_id) => {
  const result = await pool.query(
    `SELECT c.*, s.name as service_name FROM contracts c
     LEFT JOIN services s ON c.service_id = s.id
     WHERE c.client_id = $1 AND c.tenant_id = $2 ORDER BY c.created_at DESC`,
    [client_id, tenant_id]
  );
  return result.rows;
};

const getContractsByService = async (service_id, tenant_id) => {
  const result = await pool.query(
    `SELECT c.*, s.name as service_name FROM contracts c
     LEFT JOIN services s ON c.service_id = s.id
     WHERE c.service_id = $1 AND c.tenant_id = $2 ORDER BY c.created_at DESC`,
    [service_id, tenant_id]
  );
  return result.rows;
};

const getContractsByStatus = async (tenant_id) => {
  const result = await pool.query(
    `SELECT status, COUNT(*) as count FROM contracts WHERE tenant_id = $1 GROUP BY status`,
    [tenant_id]
  );
  return result.rows;
};

const getContractsByOrgan = async (tenant_id) => {
  const result = await pool.query(
    `SELECT organ, COUNT(*) as count FROM contracts WHERE tenant_id = $1 GROUP BY organ ORDER BY count DESC`,
    [tenant_id]
  );
  return result.rows;
};

const countContracts = async (tenant_id) => {
  const result = await pool.query('SELECT COUNT(*) as total FROM contracts WHERE tenant_id = $1', [tenant_id]);
  return result.rows[0].total;
};

const countActiveContracts = async (tenant_id) => {
  const result = await pool.query("SELECT COUNT(*) as total FROM contracts WHERE tenant_id = $1 AND status = 'ativo'", [tenant_id]);
  return result.rows[0].total;
};

const getDashboardStats = async (tenant_id) => {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_contracts,
      COUNT(CASE WHEN status = 'ativo' THEN 1 END) as active_contracts,
      COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_contracts,
      COUNT(CASE WHEN status = 'inativo' THEN 1 END) as inactive_contracts
    FROM contracts WHERE tenant_id = $1`,
    [tenant_id]
  );
  return result.rows[0];
};

const getContractsGroupedByOrgan = async (tenant_id) => {
  const result = await pool.query(
    `SELECT 
      c.organ,
      COUNT(*) as count,
      COUNT(CASE WHEN c.status NOT IN ('DEFERIDO','INDEFERIDO','CANCELADO') THEN 1 END) as active_count
    FROM contracts c
    LEFT JOIN services s ON c.service_id = s.id
    WHERE c.tenant_id = $1
      AND UPPER(s.name) = 'PROCESSO'
      AND c.organ IS NOT NULL
      AND c.organ != ''
    GROUP BY c.organ
    ORDER BY count DESC`,
    [tenant_id]
  );
  return result.rows;
};

// CORRIGIDO: usa UPPER() para comparar sem depender de acentos
const getAPRsByStage = async (tenant_id) => {
  const result = await pool.query(
    `SELECT c.status, COUNT(*) as count
     FROM contracts c
     LEFT JOIN services s ON c.service_id = s.id
     WHERE c.tenant_id = $1
       AND UPPER(s.name) = 'MULTA'
       AND UPPER(c.status) IN (
         'APRS DEFESA PREVIA',
         'DEFESA PREVIA - ANALISE',
         'APRS 1 INSTANCIA',
         '1 INSTANCIA - ANALISE',
         'APRS 2 INSTANCIA',
         '2 INSTANCIA - ANALISE'
       )
     GROUP BY c.status ORDER BY c.status`,
    [tenant_id]
  );
  return result.rows;
};

const getContractsNearDueDate = async (tenant_id, days = 30) => {
  const result = await pool.query(
    `SELECT c.*, cl.name as client_name, cl.phone as client_phone
     FROM contracts c LEFT JOIN clients cl ON c.client_id = cl.id
     WHERE c.tenant_id = $1 AND c.status = 'ativo'
       AND c.due_date IS NOT NULL
       AND c.due_date <= NOW() + INTERVAL '1 day' * $2
       AND c.due_date >= NOW()
     ORDER BY c.due_date ASC`,
    [tenant_id, days]
  );
  return result.rows;
};

const getOverdueContracts = async (tenant_id) => {
  const result = await pool.query(
    `SELECT c.*, cl.name as client_name, cl.phone as client_phone
     FROM contracts c LEFT JOIN clients cl ON c.client_id = cl.id
     WHERE c.tenant_id = $1 AND c.status = 'ativo'
       AND c.due_date IS NOT NULL AND c.due_date < NOW()
     ORDER BY c.due_date ASC`,
    [tenant_id]
  );
  return result.rows;
};

const getAlerts = async (tenant_id) => {
  const alerts = [];
  const nearDue = await pool.query(
    `SELECT COUNT(*) as count FROM contracts WHERE tenant_id=$1 AND status='ativo'
     AND due_date IS NOT NULL AND due_date <= NOW() + INTERVAL '7 days' AND due_date >= NOW()`,
    [tenant_id]
  );
  if (parseInt(nearDue.rows[0].count) > 0)
    alerts.push({ type: 'warning', title: 'Contratos proximos ao vencimento', message: `${nearDue.rows[0].count} contrato(s) vencem nos proximos 7 dias`, count: parseInt(nearDue.rows[0].count) });

  const overdue = await pool.query(
    `SELECT COUNT(*) as count FROM contracts WHERE tenant_id=$1 AND status='ativo' AND due_date IS NOT NULL AND due_date < NOW()`,
    [tenant_id]
  );
  if (parseInt(overdue.rows[0].count) > 0)
    alerts.push({ type: 'danger', title: 'Contratos vencidos', message: `${overdue.rows[0].count} contrato(s) estao vencidos`, count: parseInt(overdue.rows[0].count) });

  const stale = await pool.query(
    `SELECT COUNT(*) as count FROM contracts WHERE tenant_id=$1 AND status='ativo'
     AND (last_update IS NULL OR last_update < NOW() - INTERVAL '30 days')`,
    [tenant_id]
  );
  if (parseInt(stale.rows[0].count) > 0)
    alerts.push({ type: 'info', title: 'Contratos sem atualizacao', message: `${stale.rows[0].count} contrato(s) sem atualizacao ha mais de 30 dias`, count: parseInt(stale.rows[0].count) });

  return alerts;
};

const updateContract = async (id, { 
  organ, process_number, contract_number, infraction_type, 
  vehicle_plate, vehicle_model, status, value, due_date, notes,
  numero_multa, deadline_date
}, tenant_id) => {
  const result = await pool.query(
    `UPDATE contracts 
     SET organ=$1, process_number=$2, contract_number=$3, infraction_type=$4,
         vehicle_plate=$5, vehicle_model=$6, status=$7, value=$8,
         due_date=$9, notes=$10, numero_multa=$11, deadline_date=$12,
         last_update=NOW(), updated_at=NOW()
     WHERE id=$13 AND tenant_id=$14 RETURNING *`,
    [organ, process_number, contract_number, infraction_type,
     vehicle_plate, vehicle_model, status, value,
     toDateOrNull(due_date), notes, numero_multa, toDateOrNull(deadline_date),
     id, tenant_id]
  );
  return result.rows[0];
};

const updateContractStatus = async (id, status, tenant_id) => {
  const result = await pool.query(
    `UPDATE contracts SET status=$1, last_update=NOW(), updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *`,
    [status, id, tenant_id]
  );
  return result.rows[0];
};

const deleteContract = async (id, tenant_id) => {
  const result = await pool.query('DELETE FROM contracts WHERE id=$1 AND tenant_id=$2 RETURNING *', [id, tenant_id]);
  return result.rows[0];
};

module.exports = {
  createContract, getAllContracts, getContractsByFilter, getContractById,
  getContractsByClient, getContractsByService, getContractsByStatus,
  getContractsByOrgan, countContracts, countActiveContracts, getDashboardStats,
  getContractsGroupedByOrgan, getAPRsByStage, getContractsNearDueDate,
  getOverdueContracts, getAlerts, updateContract, updateContractStatus, deleteContract
};