const tenantContextMiddleware = async (req, res, next) => {
  try {
    // Pega tenant_id do header ou query string
    const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID obrigatório' });
    }
    
    // Armazena o tenantId na requisição para uso nas rotas
    req.tenantId = tenantId;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Tenant inválido', details: err.message });
  }
};

module.exports = tenantContextMiddleware;
