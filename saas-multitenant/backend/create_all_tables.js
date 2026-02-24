/**
 * Script de Migração Completa para o Banco de Dados Neon
 * Cria todas as tabelas necessárias para o CRM
 * Execute: node create_all_tables.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 1. Criar extensão para UUID (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela de TENANTS
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    value DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'novo',
    stage VARCHAR(50) DEFAULT 'lead',
    source VARCHAR(100),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    seller_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de VENDEDORES (sellers)
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(10),
    monthly_target DECIMAL(15,2) DEFAULT 50000,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela de METAS da empresa (company_targets)
CREATE TABLE IF NOT EXISTS company_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month, year)
);

-- 7. Criar tabela de ATIVIDADES (lead_activities)
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_value ON leads(value);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_seller ON leads(seller_id);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_sellers_tenant ON sellers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON sellers(active);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant ON lead_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON lead_activities(due_date);

CREATE INDEX IF NOT EXISTS idx_company_targets_tenant ON company_targets(tenant_id);

-- 9. Adicionar FK para seller_id na tabela leads (após sellers existir)
ALTER TABLE leads ADD CONSTRAINT fk_leads_seller 
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
`;

async function createAllTables() {
  console.log('🔄 Conectando ao banco de dados Neon...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Criando todas as tabelas...');
    await pool.query(sql);
    
    console.log('✅ Todas as tabelas criadas com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas criadas/encontradas:');
    tables.rows.forEach(t => console.log('  - ' + t.table_name));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhe:', err.stack);
  } finally {
    await pool.end();
  }
}

createAllTables();

