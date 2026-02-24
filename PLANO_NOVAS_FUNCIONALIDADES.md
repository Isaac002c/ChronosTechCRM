# PLANO DE IMPLEMENTAÇÃO - CHRONOS TECH CRM

## 📊 ANÁLISE DO SISTEMA ATUAL

### O que já existe:
- ✅ Tabela de leads básica (id, name, email, phone, company, status, source)
- ✅ Backend com CRUD completo
- ✅ 5 módulos: Overview, Pipeline, Acquisition, Performance, Reports
- ✅ Pipeline Kanban com drag-and-drop
- ✅ Forecast parcial no Overview
- ✅ Ranking de vendedores

### O que Precisa Adicionar:

---

## 🎯 FASE 1: Sistema de Metas Global (A)

### 1.1 Banco de Dados - Nova Tabela de Metas
```sql
-- Metas por tenant (empresa)
CREATE TABLE IF NOT EXISTS company_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    monthly_target DECIMAL(15,2),  -- Meta mensal
    annual_target DECIMAL(15,2),   -- Meta anual
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Metas por vendedor
CREATE TABLE IF NOT EXISTS seller_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    seller_id UUID REFERENCES users(id),
    monthly_target DECIMAL(15,2),
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Backend - Novos Endpoints
- `GET /api/targets` - Buscar metas da empresa
- `POST /api/targets` - Criar/atualizar metas
- `GET /api/targets/sellers` - Metas por vendedor
- `GET /api/targets/comparison` - Comparação mês a mês

### 1.3 Frontend - Painel de Gestão
- Meta mensal da empresa
- Meta anual
- Comparação mês a mês
- Projeção de fechamento do mês

---

## 💰 FASE 2: Previsão de Receita Professional (B)

### 2.1 Probabilidades por Estágio
| Estágio | Probabilidade |
|---------|--------------|
| Novo | 10% |
| Contactado | 20% |
| Qualificado | 30% |
| Proposta | 60% |
| Negociação | 80% |
| Ganho | 100% |

### 2.2 Cálculo do Forecast
```
Forecast = Σ (Valor × Probabilidade)
```

### 2.3 Mostrar no Dashboard
- 📊 Receita Fechada (real)
- 📈 Receita Projetada (forecast)
- 🎯 Meta
- 📌 Gap para meta

---

## 📋 FASE 3: Sistema de Atividades (C) - CRÍTICO

### 3.1 Banco de Dados - Tabela de Atividades
```sql
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    tenant_id UUID REFERENCES tenants(id),
    type VARCHAR(50),  -- ligação, email, reuniao, followup
    description TEXT,
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### 3.2 Backend - Endpoints
- `GET /api/activities/:leadId` - Listar atividades do lead
- `POST /api/activities` - Criar atividade
- `PUT /api/activities/:id` - Atualizar atividade
- `DELETE /api/activities/:id` - Deletar atividade
- `GET /api/activities/overdue` - Atividades atrasadas
- `GET /api/activities/inactive-leads?days=7` - Leads sem atividade

### 3.3 Frontend
- Criar tarefa no lead (modal)
- Data de vencimento
- Alerta de tarefa atrasada
- "Leads sem atividade há X dias"

---

## 🔥 FASE 4: Score Automático de Lead (D)

### 4.1 Lógica de Pontuação
```javascript
// Score Automático
let score = 0;

// Por valor (simulado por estágio)
if (stage === 'proposta' || stage === 'negociação') score += 20;
if (stage === 'qualificado') score += 15;
if (stage === 'contactado') score += 10;

// Por canal (origem)
if (source === 'indicacao') score += 15;
if (source === 'organic') score += 10;

// Por tempo no pipeline
if (daysSinceCreation > 30) score -= 10;
if (daysSinceCreation < 7) score += 10;

// Classificação
// score >= 30 = 🔥 Hot (Quente)
// score >= 15 = 🟡 Warm (Morno)
// score < 15 = ❄️ Cold (Frio)
```

### 4.2 Frontend
- Mostrarbadge de temperatura em cada lead
- Ordenar por score
- Filtro por temperatura

---

## 👥 FASE 5: Health Score do Time Comercial (E)

### 5.1 Métricas por Vendedor
- Conversão média do time
- Ciclo médio (dias para fechar)
- Receita por vendedor
- Vendedor com risco (abaixo da média)

### 5.2 Frontend - Modo Gestor
- Dashboard com saúde do time
- Alertas de vendedores abaixo da média
- Comparação individual vs equipe

---

## 📈 FASE 6: Histórico de Crescimento (F)

### 6.1 Dados Históricos
- Receita mês a mês (6-12 meses)
- Pipeline mês a mês
- Conversão mês a mês
- Crescimento vs período anterior

### 6.2 Frontend
- Gráficos de tendência
- Comparação anual
- Indicadores de crescimento

---

## 🔧 ARQUITETURA DE IMPLEMENTAÇÃO

### Arquivos a Criar:
1. `backend/models/targetModels.js` - Modelo de metas
2. `backend/models/activityModels.js` - Modelo de atividades
3. `backend/routes/targetsRoutes.js` - Rotas de metas
4. `backend/routes/activitiesRoutes.js` - Rotas de atividades
5. `saas-multitenant/app/lib/targetsAPI.js` - API client para metas
6. `saas-multitenant/app/lib/activitiesAPI.js` - API client para atividades

### Arquivos a Modificar:
1. `backend/database/leads_table.sql` - Adicionar campos e tabelas
2. `saas-multitenant/app/leads/Overview.jsx` - Adicionar metas globais, forecast, score
3. `saas-multitenant/app/leads/Pipeline.jsx` - Adicionar sistema de atividades
4. `saas-multitenant/app/leads/Performance.jsx` - Adicionar health score
5. `saas-multitenant/app/leads/Reports.jsx` - Adicionar histórico de crescimento
6. `saas-multitenant/app/globals.css` - Novos estilos

---

## ⚡ ORDEM DE IMPLEMENTAÇÃO

1. **Primeiro**: Banco de dados (tabelas e campos)
2. **Segundo**: Backend (models e routes)
3. **Terceiro**: Frontend API clients
4. **Quarto**: Frontend components

---

## 🎯 PRIORIDADES

### Alta Prioridade:
1. Sistema de Atividades (C) - CRÍTICO para retenção
2. Metas Global (A) - Gestão comercial
3. Forecast (B) - Previsão de receita

### Média Prioridade:
4. Score de Lead (D) - Identificação de oportunidades
5. Health Score (E) - Gestão de performance

### Baixa Prioridade:
6. Histórico de Crescimento (F) - Análise de tendências

