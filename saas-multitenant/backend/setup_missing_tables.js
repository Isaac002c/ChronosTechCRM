/**
 * Script para criar tabelas faltantes no banco de dados Neon
 * Execute: node setup_missing_tables.js
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

-- 2. Criar tabela de VENDEDORES (sellers) - se não existir
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

-- 3. Criar tabela de ATIVIDADES (lead_activities) - se não existir
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sellers_tenant ON sellers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON sellers(active);
CREATE INDEX IF NOT EXISTS idx_leads_seller ON leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant ON lead_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON lead_activities(due_date);

-- 5. Adicionar coluna seller_id na tabela leads (se não existir)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

-- 6. Adicionar índice para seller_id
CREATE INDEX IF NOT EXISTS idx_leads_seller_id ON leads(seller_id);
`;

async function setupMissingTables() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Criando tabelas faltantes...');
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas/atualizadas com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('sellers', 'lead_activities')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas:');
    tables.rows.forEach(t => console.log('  - ' + t.table_name));
    
    // Verificar colunas da tabela leads
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'seller_id'
    `);
    
    if (columns.rows.length > 0) {
      console.log('✅ Coluna seller_id já existe na tabela leads');
    } else {
      console.log('⚠️ Coluna seller_id não foi adicionada');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhe:', err.stack);
  } finally {
    await pool.end();
  }
}

setupMissingTables();

