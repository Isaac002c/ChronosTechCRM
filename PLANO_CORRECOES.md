# Plano de Verificação e Correção do Sistema

## Problemas Identificados

### 1. 🔴 CRÍTICO: Porta incorreta no Login
- **Arquivo**: `app/login/page.jsx`
- **Problema**: O login está tentando conectar na porta 5000, mas o backend roda na porta 3000
- **Solução**: Alterar de `localhost:5000` para `localhost:3000`

### 2. 🔴 CRÍTICO: API URL no leadsAPI
- **Arquivo**: `app/lib/leadsAPI.js`
- **Problema**: Usa `localhost:3000` como default, mas precisa estar alinhado com o backend
- **Solução**: Verificar se a variável de ambiente NEXT_PUBLIC_API_URL está设置 corretamente

### 3. 🟡 Verificar Dashboard logout
- **Arquivo**: `app/dashboard/page.jsx`
- **Problema**: O logout tenta conectar em `localhost:3000` que está correto
- **Status**: ✅ Parece OK

### 4. 🟡 Verificar variáveis de ambiente
- Precisa verificar se `.env` tem:
  - `DATABASE_URL` configurado
  - `JWT_SECRET` configurado
  - `PORT=3000` (opcional, default já é 3000)

## Passos de Correção

### Passo 1: Corrigir URL do Login
- Alterar `http://localhost:5000` para `http://localhost:3000` em `app/login/page.jsx`

### Passo 2: Testar Backend
- Executar `cd saas-multitenant/backend && node app.js`
- Verificar se conecta no banco
- Verificar se está ouvindo na porta 3000

### Passo 3: Testar Frontend  
- Executar `cd saas-multitenant && npm run dev`
- Acessar `http://localhost:3001`
- Testar login

### Passo 4: Verificar funcionalidades
- Criar novo lead
- Listar leads
- Verificar Overview
- Verificar Pipeline
- Verificar Performance

## Arquivos para Verificação
- [x] backend/app.js
- [x] backend/config/db.js
- [x] backend/routes/authRoutes.js
- [x] backend/routes/leadsRoutes.js
- [x] backend/models/leadModels.js
- [x] app/login/page.jsx
- [x] app/dashboard/page.jsx
- [ ] app/leads/Overview.jsx
- [ ] app/leads/Pipeline.jsx
- [ ] app/leads/Performance.jsx

