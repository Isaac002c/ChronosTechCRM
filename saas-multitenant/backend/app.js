require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tenantContext = require('./middlewares/tenantContext');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetsRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// 1. AUTH SEMPRE PRIMEIRO (register/login SEM tenant)
app.use('/auth', authRoutes);

// 2. FRONTEND ESTÁTICO (NUNCA passa por middleware)
app.use(express.static(path.join(__dirname, 'public')));
app.get(['/', '/dashboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. APENAS ROTAS API PRIVADAS usam tenantContext
app.use('/api', tenantContext);  // ← /api/assets, /api/webhooks
app.use('/api/assets', assetRoutes);
app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 CRM rodando na porta ${PORT}`));
