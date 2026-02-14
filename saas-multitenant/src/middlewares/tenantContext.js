const pool = require('../config/db');

const tenantContextMiddleware = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
    
    if (!tenantId) {
      client.release();
      return res.status(400).json({ error: 'Tenant ID obrigatório' });
    }
    
    await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
    req.db = client;
    req.tenantId = tenantId;
    
    next();
  } catch (err) {
    client.release();
    res.status(400).json({ error: 'Tenant inválido', details: err.message });
  }
};

module.exports = tenantContextMiddleware;
