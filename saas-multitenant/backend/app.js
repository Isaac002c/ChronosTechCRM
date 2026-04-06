// ============================================
// ChronosTech CRM - Express Backend
// FINAL VERSION (CORS 100% FUNCIONAL)
// ============================================

require('dns').setDefaultResultOrder('ipv4first');
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

const clientRoutes = require('./routes/clientRoutes');
const contractRoutes = require('./routes/contractRoutes');
const documentRoutes = require('./routes/documentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const saasRoutes = require('./routes/saasRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const finesRoutes = require('./routes/finesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ============================================
// 🔥 CORS CONFIG (CORRETO MESMO)
// ============================================

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
'https://crm.chronostek.com.br'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS BLOCKED:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// 🔥 MUITO IMPORTANTE: aplicar ANTES DE TUDO
app.use(cors(corsOptions));

// 🔥 PREFLIGHT CORRETO (USA A MESMA CONFIG)
app.options('*', cors(corsOptions));

// ============================================
// MIDDLEWARES
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS
// ============================================

// Públicas
app.use('/auth', authRoutes);

// Protegidas
app.use('/api', tenantContext);

app.use('/api/leads', leadsRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use('/api/clients', clientRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/services', serviceRoutes);

app.use('/api', saasRoutes);
app.use('/api/fines', finesRoutes);
app.use('/api/users/management', userManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// 404
// ============================================

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao Banco de Dados');
  } catch (err) {
    console.error('❌ Erro ao conectar no banco:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CRM rodando na porta ${PORT}`);
  });
})();