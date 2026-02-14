# ChronosTech CRM - Integração Frontend e Backend

## ✅ Etapas Concluídas

### 1. Configuração CORS
- Adicionado CORS no backend para permitir requisições do frontend (portas 3000 e 3001)
- Arquivo: `saas-multitenant/backend/app.js`

### 2. Arquivo .env Criado
- Criado `saas-multitenant/backend/.env` com variáveis necessárias:
  - DATABASE_URL
  - JWT_SECRET
  - PORT

## 📋 Próximos Passos (Manual)

### 1. Configure o Banco de Dados
Edite o arquivo `.env` e adicione sua URL de conexão do Supabase:
```
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
```

### 2. Execute o Script SQL
Rode o script em `saas-multitenant/backend/database/leads_table.sql` no seu banco Supabase para criar a tabela de leads.

### 3. Instale as dependências
```bash
# Backend
npm install

# Frontend
cd saas-multitenant/frontend && npm install
```

### 4. Inicie os servidores
```bash
# Terminal 1 - Backend (porta 3000)
node saas-multitenant/backend/app.js

# Terminal 2 - Frontend (porta 3001)
cd saas-multitenant/frontend && npm start
```

### 5. Teste a Integração
1. Acesse `http://localhost:3001`
2. Faça login ou registre um novo usuário
3. Navegue até "Leads" e teste criar/editar/listar leads

