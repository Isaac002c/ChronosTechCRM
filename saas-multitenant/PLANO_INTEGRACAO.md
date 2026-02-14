# PLANO DE INTEGRAÇÃO FRONTEND-BACKEND

## 1. CONFIGURAÇÃO DE AMBIENTE

### Problema Identificado:
- Backend Express roda na porta 3000
- Frontend Next.js também tenta rodar na porta 3000
- Conflito de portas!

### Solução:
- Backend permanece na porta 3000
- Frontend Next.js deve usar porta 3001

### Arquivos a criar:
- [ ] `saas-multitenant/.env.local` - Variáveis de ambiente do Next.js

## 2. CORREÇÕES NO FRONTEND

### 2.1 Arquivo .env.local
Criar com:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2.2 Arquivo leadsAPI.js
Melhorias necessárias:
- [x] Já está correto - pega token e tenant_id dos cookies
- [ ] Adicionar tratamento de erros mais robusto

### 2.3 Arquivo login/page.jsx
Verificações:
- [x] Já está enviando credentials: 'include'
- [x] Já armazena token e tenant

### 2.4 Arquivo dashboard/page.jsx
Verificações:
- [x] Verifica autenticação
- [x] Passa tenant_id nas requisições (via leadsAPI)

## 3. CORREÇÕES NO BACKEND

### 3.1 CORS
Verificar se允许:
- [x] http://localhost:3001 (Next.js)
- [x] credentials: true
- [x] Headers: Authorization, x-tenant-id

### 3.2 Middleware tenantContext
- [x] Já está correto

## 4. TESTES DE INTEGRAÇÃO

### 4.1 Iniciar Backend
```bash
cd saas-multitenant/backend
node app.js
```

### 4.2 Iniciar Frontend
```bash
cd saas-multitenant
npm run dev -- -p 3001
```

### 4.3 Fluxo de Teste
1. Abrir http://localhost:3001/login
2. Fazer login (usuário existente ou criar conta)
3. Verificar se redireciona para dashboard
4. Testar cada aba do módulo Leads
5. Criar/editar/deletar lead

## 5. ARQUITETURA FINAL

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js)                │
│                    Porta: 3001                       │
├─────────────────────────────────────────────────────┤
│  /login → auth-token + tenant-id (cookies)         │
│  /dashboard → Leads (Overview/Acquisition/etc)     │
│  leadsAPI → http://localhost:3000/api/leads        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (Express)                  │
│                    Porta: 3000                      │
├─────────────────────────────────────────────────────┤
│  POST /auth/login → JWT + cookies                  │
│  GET  /api/leads → retorna dados do tenant        │
│  GET  /api/leads/stats → métricas                  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              DATABASE (Supabase)                   │
│              PostgreSQL Multitenant                 │
└─────────────────────────────────────────────────────┘
```

## 6. PRÓXIMOS PASSOS APÓS CONFIRMAÇÃO

- [ ] Criar arquivo .env.local
- [ ] Iniciar backend (node app.js)
- [ ] Iniciar frontend (npm run dev -p 3001)
- [ ] Testar fluxo completo de login
- [ ] Testar CRUD de leads
- [ ] Verificar se todas as abas funcionam

