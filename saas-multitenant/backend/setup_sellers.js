/**
 * Script para executar as migrações do banco de dados - PARTE 2
 * Execute: node setup_sellers.js
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
-- Criar tabela de VENDEDORES (se não existir)
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(10),
    monthly_target DECIMAL(15,2) DEFAULT 50000,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sellers_tenant ON sellers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON sellers(active);
`;

async function setup() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Executando SQL...');
    await pool.query(sql);
    
    console.log('✅ Tabela de vendedores criada com sucesso!');
    
    // Verificar tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'sellers'
    `);
    
    console.log('\n📋 Tabela criada:');
    tables.rows.forEach(t => console.log('  - ' + t.table_name));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

setup();

