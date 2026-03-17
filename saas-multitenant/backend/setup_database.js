/**
 * Script para executar as migrações do banco de dados
 * Execute: node setup_database.js
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
-- 1. Adicionar colunas na tabela leads (se não existirem)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'lead';

-- 2. Criar tabela de METAS da empresa
CREATE TABLE IF NOT EXISTS company_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month, year)
);

-- 3. Criar tabela de ATIVIDADES
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_leads_value ON leads(value);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant ON lead_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON lead_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_company_targets_tenant ON company_targets(tenant_id);
`;

async function setup() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    // Testar conexão
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Executando SQL...');
    await pool.query(sql);
    
    console.log('✅ Banco de dados configurado com sucesso!');
    
    // Verificar tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('leads', 'company_targets', 'lead_activities')
    `);
    
    console.log('\n📋 Tabelas criadas/encontradas:');
    tables.rows.forEach(t => console.log('  - ' + t.table_name));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
