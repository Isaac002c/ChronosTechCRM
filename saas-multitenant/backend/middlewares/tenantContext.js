// middlewares/tenantContext.js
const jwt = require('jsonwebtoken');

console.log('[tenantContext] Middleware carregado!');

module.exports = function tenantContext(req, res, next) {
  console.log(`[tenantContext] Executando para: ${req.method} ${req.originalUrl}`);

  try {
    let token = null;

    // 1️⃣ Header Authorization
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2️⃣ Cookie - suporta ambos 'token' e 'auth-token'
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    else if (req.cookies?.['auth-token']) {
      token = req.cookies['auth-token'];
    }

    // 3️⃣ Query string (opcional)
    else if (req.query?.token) {
      token = req.query.token;
    }

    // 4️⃣ Se não tiver token
    if (!token) {
      console.warn(`[tenantContext] Token não fornecido para ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    // 5️⃣ Decodifica e verifica token
    let decoded;
    try {
decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-super-secreta-crm');
    } catch (err) {
      console.warn('[tenantContext] Token inválido ou expirado:', err.message);
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // 6️⃣ Valida tenantId
    if (!decoded.tenantId) {
      console.warn('[tenantContext] tenantId não encontrado no token.');
      return res.status(401).json({ error: 'Tenant inválido.' });
    }

    // 7️⃣ Popula request com informações do usuário
    req.tenantId = String(decoded.tenantId);
    req.userId = decoded.userId || null;
    req.userEmail = decoded.email || null;
    req.userRole = decoded.role || 'seller'; // padrão: seller
    req.sellerId = decoded.sellerId || null; // ID do vendedor vinculado

    console.log('[tenantContext] JWT Decoded:', {
      userId: req.userId,
      tenantId: req.tenantId,
      email: req.userEmail,
      role: req.userRole,
      sellerId: req.sellerId
    });

    next();

  } catch (error) {
    console.error('[tenantContext] Erro inesperado:', error);
    return res.status(500).json({ error: 'Erro interno no middleware tenantContext.' });
  }
};
