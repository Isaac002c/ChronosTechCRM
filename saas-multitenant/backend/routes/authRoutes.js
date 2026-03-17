const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser } = require('../models/userModels');
const { createTenant } = require('../models/tenantModels');
const pool = require('../config/db');

// Helper function to ensure JSON response
const sendJson = (res, status, data) => {
  res.status(status).setHeader('Content-Type', 'application/json').json(data);
};

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { tenantName, name, email, password } = req.body;
    
    if (!tenantName || !name || !email || !password) {
      return sendJson(res, 400, {
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    // Criar tenant
    const tenant = await createTenant(tenantName);
    
    // Criar usuário associado ao tenant - primeiro usuário vira admin
    // Verificar se já existem usuários neste tenant
    const existingUsers = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenant.id]
    );
    const isFirstUser = parseInt(existingUsers.rows[0].count) === 0;
    
    const user = await createUser({ 
      name, 
      email, 
      password,
      tenant_id: tenant.id,
      role: isFirstUser ? 'admin' : 'seller'
    });

    sendJson(res, 201, { 
      success: true,
      tenant_id: tenant.id,
      message: 'Tenant + usuário criado com sucesso!'
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    sendJson(res, 500, { 
      success: false,
      message: 'Erro ao registrar tenant e usuário',
      error: err.message 
    });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  let client;
  console.log('[LOGIN] Iniciando processo de login...');
  try {
    const { email, password } = req.body;
    
    console.log('[LOGIN] Tentando login com:', email);
    
    if (!email || !password) {
      return sendJson(res, 400, { 
        success: false,
        message: 'Email e senha obrigatórios' 
      });
    }

    client = await pool.connect();
    console.log('[LOGIN] Conectado ao banco');
    
    // Busca user + tenant + role (sem seller_id por enquanto)
    console.log('[LOGIN] Executando query SQL...');
    const result = await client.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.tenant_id, u.role,
              t.name as tenant_name 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = $1`,
      [email]
    );
    
    console.log('[LOGIN] Query executada com sucesso, rows:', result.rows.length);
    
    const user = result.rows[0];
    if (!user) {
      console.log('[LOGIN] Usuário não encontrado');
      return sendJson(res, 401, { 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    console.log('[LOGIN] Usuário encontrado:', user.name, '- tenant:', user.tenant_id);

    // Verifica senha
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);
    console.log('[LOGIN] Senha válida:', isValidPassword);
    
    if (!isValidPassword) {
      return sendJson(res, 401, { 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    console.log('[LOGIN] User found - tenant_id:', user.tenant_id, 'type:', typeof user.tenant_id);
    console.log('[LOGIN] User role:', user.role);

    // JWT com tenant_id e role
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role || 'admin'
      },
      process.env.JWT_SECRET || 'sua-chave-super-secreta-crm',
      { expiresIn: '30d' }
    );

    console.log('[LOGIN] Token created with role:', user.role);

    // Decodificar para verificar (apenas para debug)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-super-secreta-crm');
    console.log('[LOGIN] Token decoded:', JSON.stringify(decoded));

    // Enviar cookies HTTP-only junto com a resposta
    // Cookie principal (token)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    // Cookie alternativo (auth-token) para compatibilidade
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.cookie('tenantId', user.tenant_id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    sendJson(res, 200, { 
      success: true,
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role || 'admin'
      },
      tenant: { 
        id: user.tenant_id, 
        name: user.tenant_name 
      }
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    sendJson(res, 500, { 
      success: false,
      message: 'Erro no servidor',
      error: err.message 
    });
  } finally {
    if (client) client.release();
  }
});

// 3. VALIDATE TOKEN
router.post('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return sendJson(res, 401, { success: false, message: 'Token obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-super-secreta-crm');
    sendJson(res, 200, { 
      success: true, 
      user: { id: decoded.userId, email: decoded.email },
      tenant: { id: decoded.tenantId },
      role: decoded.role || 'seller',
      sellerId: decoded.sellerId
    });
  } catch (err) {
    sendJson(res, 401, { success: false, message: 'Token inválido' });
  }
});

// 4. LOGOUT
router.post('/logout', async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('auth-token');
  res.clearCookie('tenantId');
  sendJson(res, 200, { success: true, message: 'Logout realizado com sucesso' });
});

module.exports = router;
