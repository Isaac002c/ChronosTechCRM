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
    
    // Criar usuário associado ao tenant
    const user = await createUser({ 
      name, 
      email, 
      password,
      tenant_id: tenant.id 
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
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendJson(res, 400, { 
        success: false,
        message: 'Email e senha obrigatórios' 
      });
    }

    client = await pool.connect();
    
    // Busca user + tenant
    const result = await client.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.tenant_id, 
              t.name as tenant_name 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = $1`,
      [email]
    );
    
    const user = result.rows[0];
    if (!user) {
      return sendJson(res, 401, { 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    // Verifica senha
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);
    if (!isValidPassword) {
      return sendJson(res, 401, { 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    console.log('[LOGIN] User found - tenant_id:', user.tenant_id, 'type:', typeof user.tenant_id);

    // JWT com tenant_id - GARANTIR QUE tenantId ESTÁ NO PAYLOAD
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenant_id,  // ← Este campo DEVE estar presente
        email: user.email 
      },
      process.env.JWT_SECRET || 'sua-chave-super-secreta-crm',
      { expiresIn: '30d' }
    );

    console.log('[LOGIN] Token created with tenantId:', user.tenant_id);

    // Decodificar para verificar (apenas para debug)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-super-secreta-crm');
    console.log('[LOGIN] Token decoded:', JSON.stringify(decoded));

    // Enviar cookies HTTP-only junto com a resposta
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.cookie('tenant-id', user.tenant_id.toString(), {
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
        email: user.email 
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
      tenant: { id: decoded.tenantId }
    });
  } catch (err) {
    sendJson(res, 401, { success: false, message: 'Token inválido' });
  }
});

// 4. LOGOUT
router.post('/logout', async (req, res) => {
  res.clearCookie('auth-token');
  res.clearCookie('tenant-id');
  sendJson(res, 200, { success: true, message: 'Logout realizado com sucesso' });
});

module.exports = router;
