# Chronos Tech CRM

CRM SaaS multitenant desenvolvido com Next.js 14 e Express.

---

##  Visão Geral

O Chronos Tech CRM é um sistema CRM modular com arquitetura **multitenant**, permitindo que múltiplas empresas (tenants) utilizem a mesma instância do sistema com dados isolados.

### Tecnologias

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: JWT com cookies

---

##  Estrutura do Projeto

```
ChronosTechCRM/saas-multitenant/
├── app/                    # Frontend (Next.js 14)
│   ├── components/         # Componentes compartilhados
│   │   ├── Header.jsx     # Header global
│   │   └── ModuleLayout.jsx # Layout de módulo
│   ├── dashboard/         # Página principal
│   ├── leads/             # Módulo Leads
│   │   ├── Overview.jsx   # Visão Geral
│   │   ├── Acquisition.jsx # Aquisição & Funil
│   │   ├── Pipeline.jsx   # Pipeline Kanban
│   │   ├── Performance.jsx # Performance
│   │   └── Reports.jsx    # Relatórios
│   ├── login/             # Página de login
│   ├── register/          # Página de cadastro
│   ├── layout.jsx         # Layout raiz
│   ├── page.jsx           # Landing page
│   └── globals.css        # Estilos globais
│
├── backend/               # Backend (Express)
│   ├── config/
│   │   └── db.js          # Conexão com banco
│   ├── controllers/       # Controllers
│   ├── database/
│   │   └── leads_table.sql # Script SQL
│   ├── middlewares/
│   │   └── tenantContext.js # Multitenancy
│   ├── models/           # Modelos do banco
│   ├── routes/            # Rotas da API
│   │   ├── authRoutes.js  # Autenticação
│   │   ├── leadsRoutes.js # Leads API
│   │   └── ...
│   ├── services/          # Serviços
│   └── app.js             # Servidor principal
│
├── .env                   # Variáveis de ambiente
├── package.json
└── README.md
```

---

##  Módulo Leads

O módulo Leads possui 5 abas:

| Aba | Descrição |
|-----|-----------|
| **Overview** | Métricas gerais, KPIs, leads por status |
| **Acquisition** | Análise de aquisição e conversão |
| **Pipeline** | Kanban visual de oportunidades |
| **Performance** | Performance da equipe |
| **Reports** | Relatórios e análises |

---

##  Multitenancy

O sistema utiliza middleware `tenantContext` para isolar dados por tenant:

1. Usuário faz login → recebe `tenant_id` no cookie
2. Todas requisições incluem header `x-tenant-id`
3. Backend filtra dados pelo `tenant_id`

---

##  Como Rodar

### Pré-requisitos

- Node.js 
- Banco de dados PostgreSQL (Supabase)

### Configuração

1. Clone o projeto
2. Configure o arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres
JWT_SECRET=[SUA_CHAVE_SECRETA]
PORT=3000
```

3. Execute o script SQL em `backend/database/leads_table.sql` no banco

### Iniciar Backend

```bash
cd saas-multitenant
node backend/app.js
```

O backend roda na porta **3000**.

### Iniciar Frontend

```bash
cd saas-multitenant
npm run dev -- -p 3001
```

O frontend roda na porta **3001**.

---
