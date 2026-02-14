# Cronograma de Migração React → Next.js

## Objetivo
Migrar o frontend de React SPA para Next.js para resolver problemas de integração com o backend.

## Passos:

### 1. Preparação ✅
- [x] Criar estrutura base do projeto Next.js
- [x] Criar package.json com dependências
- [x] Criar next.config.js
- [x] Criar jsconfig.json

### 2. Autenticação ✅
- [x] Criar página de Login (app/login/page.jsx)
- [x] Criar página de Registro (app/register/page.jsx)
- [x] Configurar autenticação com JWT + cookies HTTP-only
- [x] Criar middleware de proteção de rotas (verificação no client)
- [x] Adicionar rota de logout no backend

### 3. Dashboard e Layout ✅
- [x] Criar layout principal (app/layout.jsx)
- [x] Criar globals.css com estilos
- [x] Criar Dashboard (app/dashboard/page.jsx)

### 4. Módulo de Leads ✅
- [x] Criar API service (app/lib/leadsAPI.js)
- [x] Converter Overview.jsx
- [x] Converter Acquisition.jsx
- [x] Converter Performance.jsx

### 5. Backend Atualizações ✅
- [x] Atualizar CORS para Next.js
- [x] Adicionar cookies HTTP-only no login
- [x] Criar rota de logout

### 6. Execução
- [ ] Executar npm install
- [ ] Iniciar backend (porta 3000)
- [ ] Iniciar Next.js (porta 3002)

## Status: PRONTO PARA TESTAR


