# Correções do Erro "null value in column 'tenant_id'"

## Problema Identificado
O erro `null value in column "tenant_id" of relation "leads" violates not-null constraint` ocorre porque o `tenant_id` não está chegando corretamente ao banco de dados na criação de novos leads.

## Correções Aplicadas (23/01/2025)

### 1. Backend - leadsRoutes.js (CORRIGIDO)
- Adicionados logs de debug no POST /api/leads
- Adicionada validação que retorna 401 se tenantId não for encontrado
- Log mostra: `[leadsRoutes] POST / - tenantId: <UUID> type: string`

## Como Testar

1. **Reinicie o backend:**
```
bash
cd saas-multitenant/backend
npm run dev
```

2. **Faça login novamente** (para obter novo token)

3. **Tente criar um lead** e verifique os logs no terminal

4. **Verifique os logs** esperados:
   - `[leadsRoutes] POST / - tenantId: <UUID> type: string`
   - Se aparecer `tenantId: undefined`, o problema está no token JWT

## Fluxo Esperado

1. Usuário faz login → JWT contém `tenantId` no payload
2. Frontend envia token no header Authorization
3. Middleware `tenantContext` extrai `tenantId` do token
4. Route `leadsRoutes` obtém `req.tenantId`
5. Model `leadModels` executa INSERT com `tenant_id`

## Se o erro persistir

1. Verifique se o banco tem tenants: `SELECT * FROM tenants;`
2. Verifique se o usuário tem tenant_id: `SELECT * FROM users;`
3. Faça logout e login novamente para gerar novo token
