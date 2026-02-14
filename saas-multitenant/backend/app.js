require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const tenantContext = require('./middlewares/tenantContext');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const leadsRoutes = require('./routes/leadsRoutes');
const assetRoutes = require('./routes/assetsRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// CORS configurado para permitir requisições do frontend React e Next.js
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:3002', // Next.js default
  ],
  credentials: true, // Permite envio de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));
app.use(express.json());

// 1. AUTH SEMPRE PRIMEIRO (register/login SEM tenant)
app.use('/auth', authRoutes);

// 2. FRONTEND ESTÁTICO (NUNCA passa por middleware)
app.use(express.static(path.join(__dirname, 'public')));
app.get(['/', '/dashboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. APENAS ROTAS API PRIVADAS usam tenantContext
app.use('/api', tenantContext);  // ← /api/leads, /api/assets, /api/webhooks
app.use('/api/leads', leadsRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` CRM rodando na porta ${PORT}`));
