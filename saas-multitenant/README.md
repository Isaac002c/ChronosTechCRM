# Chronos Tech CRM

CRM SaaS multitenant desenvolvido do zero, com arquitetura pensada para escalar de MVP até produto profissional.

---

##  Visão Geral

O Chronos Tech CRM é dividido em **backend (Node.js)**, **banco de dados (PostgreSQL/Supabase)** e **frontend (React)**, seguindo separação clara de responsabilidades.

Objetivos principais:

* Multi-tenant (várias empresas usando o mesmo sistema)
* Modular (Leads, Financeiro, Cyber, etc)
* Arquitetura limpa e reutilizável
* Pronto para evoluir para planos PRO

---

##  Arquitetura Geral

```
[ React (Frontend) ]
        ↓ API REST / JWT
[ Node.js + Express (Backend) ]
        ↓
[ PostgreSQL (Supabase) ]
```

---

##  Autenticação

* Autenticação baseada em **JWT**
* Token armazenado no `localStorage`
* Rotas protegidas no frontend via `ProtectedRoute`
* Backend valida token em middleware

---

##  Banco de Dados (PostgreSQL / Supabase)

### Conceitos principais

* **Multi-tenant**: todas as tabelas possuem `tenant_id`
* **Row Level Security (RLS)** habilitado
* Policies garantem que um tenant não veja dados de outro

### Tabelas principais (exemplo)

* tenants
* users
* leads
* lead_status
* opportunities
* sales

Cada registro pertence a um `tenant_id`.

---

##  Backend (Node.js)

### Stack

* Node.js
* Express
* JWT
* Middleware de autenticação
* Arquitetura REST

### Responsabilidades

* Login / autenticação
* Validação de token
* CRUD de módulos (leads, vendas, etc)
* Regras de negócio

### Estrutura base

```
backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   ├── services/
│   └── index.js
```

---

##  Frontend (React)

### Stack

* React
* React Router
* CSS puro (por enquanto)
* Arquitetura modular

---

##  Arquitetura do Frontend

### Princípios

* **App.js não conhece layout nem módulos**
* Layout é genérico
* Módulos apenas injetam configuração

---

### Estrutura de Pastas

```
src/
├── App.js
├── layouts/
│   └── ModuleLayout.jsx
├── pages/
│   ├── Login.jsx
│   └── Dashboard.jsx
├── components/
│   ├── Header.jsx
│   └── ProtectedRoute.jsx
├── modules/
│   └── leads/
│       ├── index.js
│       └── pages/
│           ├── Overview.jsx
│           ├── Acquisition.jsx
│           └── Performance.jsx
```

---

##  App.js

Responsável apenas por:

* rotas públicas
* rotas protegidas

Não possui lógica de layout nem módulos.

---

##  ProtectedRoute

* Componente que valida se existe token
* Se não existir → redireciona para `/login`
* Se existir → renderiza o conteúdo protegido

---

##  Dashboard

* Página principal após login
* Monta:

  * Header global
  * ModuleLayout

Responsável futuramente por:

* trocar módulo ativo
* gerenciar estado global do módulo

---

##  ModuleLayout (Layout Cru)

Layout genérico reutilizado por todos os módulos.

### Responsabilidades

* Margem geral da página
* Cabeçalho do módulo
* Botão de três pontos (⋮)
* Sidebar lateral que abre/fecha
* Renderizar tabs do módulo

### NÃO faz

* Não conhece Leads
* Não conhece Financeiro
* Não possui regras de negócio

---

## Módulos

Cada módulo:

* NÃO cria layout
* NÃO mexe em estrutura visual global
* Apenas exporta configuração

### Exemplo: módulo Leads

```
export const leadsModule = {
  name: 'Leads',
  tabs: [
    { key: 'overview', label: 'Visão Geral', component: Overview },
    { key: 'acquisition', label: 'Aquisição & Funil', component: Acquisition },
    { key: 'performance', label: 'Performance', component: Performance }
  ]
}
```

---

##  Módulo Leads – Estrutura de Produto

### Aba 1 – Visão Geral

* Cards de métricas
* Leads ao longo do tempo
* Funil resumido
* Leads por status
* Origem dos leads

### Aba 2 – Aquisição & Funil

* Leads por origem
* Conversão por canal
* Funil completo
* Tempo por etapa
* Motivos de perda

### Aba 3 – Performance

* Tempo médio de resposta
* Leads sem follow-up
* Performance por vendedor
* Ranking de vendedores

---

## Próximos Passos 

* Integração frontend ↔ backend
* Rotas por aba (`/leads/overview`)
* Gráficos reais (Recharts ou similar)
* Controle de permissões por usuário
* Planos (Free / Pro)
* Auditoria e logs

**Chronos Tech CRM**

Projeto desenvolvido com foco em aprendizado profundo e construção de um SaaS real.
