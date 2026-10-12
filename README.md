# Chronostek CRM

CRM web em desenvolvimento para organizar informações de clientes e apoiar rotinas comerciais e operacionais.

## Sobre o projeto

A aplicação combina uma interface web em Next.js e React com uma API backend em Node.js e Express. O código está organizado em módulos para clientes, contratos, leads, documentos, multas, metas, vendedores e administração de usuários.

O repositório demonstra integração entre frontend e backend, autenticação, validação de dados e persistência relacional com PostgreSQL.

## Tecnologias

- Next.js 14 e React 18
- Node.js e Express
- PostgreSQL (`pg`)
- JWT e bcryptjs
- Helmet, CORS, express-validator e express-rate-limit

## Estrutura

- `saas-multitenant/` — aplicação web Next.js
- `saas-multitenant/backend/` — API Express

## Executar localmente

Pré-requisitos: Node.js, npm e uma instância PostgreSQL acessível.

1. Configure o backend com as variáveis `DATABASE_URL`, `JWT_SECRET`, `PORT` e `NODE_ENV`.
2. Em um terminal, instale as dependências e inicie a API:

   ```bash
   cd saas-multitenant/backend
   npm install
   npm run dev
   ```

3. Configure `NEXT_PUBLIC_API_URL` na aplicação web para apontar para a API local.
4. Em outro terminal, instale as dependências e inicie o frontend:

   ```bash
   cd saas-multitenant
   npm install
   npm run dev
   ```

O frontend inicia na porta `3001`, conforme o script do projeto. Use valores próprios para as variáveis de ambiente e não publique credenciais.