// ============================================
// ChronosTech CRM - Express Backend
// app.js - Final Version (Render Ready)
// ============================================

require('dns').setDefaultResultOrder('ipv4first'); // força IPv4 primeiro
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const tenantContext = require('./middlewares/tenantContext');
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const leadsRoutes = require('./routes/leadsRoutes');
const assetRoutes = require('./routes/assetsRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const targetsRoutes = require('./routes/targetsRoutes');
const sellersRoutes = require('./routes/sellersRoutes');
const forecastRoutes = require('./routes/forecastRoutes');

// Novas rotas do módulo de multas
const clientRoutes = require('./routes/clientRoutes');
const contractRoutes = require('./routes/contractRoutes');
const documentRoutes = require('./routes/documentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// Rotas SaaS
const saasRoutes = require('./routes/saasRoutes');

// Rotas de gerenciamento de usuários
const userManagementRoutes = require('./routes/userManagementRoutes');
const finesRoutes = require('./routes/finesRoutes');

const app = express();

// ============================================
// CORS FIX DEFINITIVO (Render/Vercel Compatible)
// ============================================

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chronos-tech-crm.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // permite requests sem origin (Postman/mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS BLOCKED:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// RESOLVE PREFLIGHT (OPTIONS)
app.options('*', cors());

// ============================================
// CONFIGURAÇÕES
// ============================================

// --- 2. Body parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 3. Cookie parser ---
app.use(cookieParser());

// --- 4. Logging de requisições ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS PÚBLICAS (Auth)
// ============================================

app.use('/auth', authRoutes);

// ============================================
// ROTAS PROTEGIDAS (Multi-tenant)
// ============================================

app.use('/api', tenantContext);

app.use('/api/leads', leadsRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/webhooks', webhookRoutes);

// Módulo de multas
app.use('/api/clients', clientRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/services', serviceRoutes);

// SaaS
app.use('/api', saasRoutes);

// Multas
app.use('/api/fines', finesRoutes);

// Gestão de usuários
app.use('/api/users/management', userManagementRoutes);

// ============================================
// 404 Handler
// ============================================

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ============================================
// Global Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);

  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ============================================
// START SERVER (CORRIGIDO PRA RENDER)
// ============================================

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao Banco de Dados');
  } catch (err) {
    console.error('❌ Erro ao conectar no banco:', err.message);
    // NÃO derruba o servidor (IMPORTANTE pro Render)
  }

  app.listen(PORT, () => {
    console.log(`🚀 CRM rodando na porta ${PORT}`);
  });
})();

