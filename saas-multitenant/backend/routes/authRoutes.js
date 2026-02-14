const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser } = require('../models/userModels');
const { createTenant } = require('../models/tenantModels');
const pool = require('../config/db'); // ← pra login

// 1. REGISTER (você já tem - mantido)
router.post('/register', async (req, res) => {
    try {
        const { tenantName, name, email, password } = req.body;
        
        // Criar tenant
        const tenant = await createTenant(tenantName);
        
        // Criar usuário associado ao tenant
        const user = await createUser({ 
            name, 
            email, 
            password,  // ← seu model já faz hash
            tenant_id: tenant.id 
        });

        res.json({ 
            success: true,
            tenant_id: tenant.id,
            message: 'Tenant + usuário criado com sucesso!'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao registrar tenant e usuário',
            error: err.message 
        });
    }
});

// 2. LOGIN (NOVO - enterprise grade)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email e senha obrigatórios' 
            });
        }

        const client = await pool.connect();
        try {
            // Busca user + tenant (RLS ignora tenant errado)
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
                return res.status(401).json({ 
                    success: false,
                    message: 'Credenciais inválidas' 
                });
            }

            // Verifica senha
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Credenciais inválidas' 
                });
            }

            // JWT com tenant_id (frontend usa no x-tenant-id)
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    tenantId: user.tenant_id, 
                    email: user.email 
                },
                process.env.JWT_SECRET || 'sua-chave-super-secreta-crm',
                { expiresIn: '30d' } // 30 dias
            );

            res.json({ 
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
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Login erro:', err);
        res.status(500).json({ 
            success: false,
            message: 'Erro no servidor',
            error: err.message 
        });
    }
});

// 3. VALIDATE TOKEN (pra frontend checar se tá logado)
router.post('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token obrigatório' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-super-secreta-crm');
        res.json({ 
            success: true, 
            user: { id: decoded.userId, email: decoded.email },
            tenant: { id: decoded.tenantId }
        });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
});

module.exports = router;
