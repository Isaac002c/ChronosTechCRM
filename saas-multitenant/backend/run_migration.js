/**
 * Script de migração para adicionar seller_id na tabela de leads
 * Execute: node run_migration.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🔄 Executando migração...');
  
  try {
    // 1. Adicionar coluna seller_id (sem FK inicialmente para evitar erro circular)
    await pool.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS seller_id UUID;
    `);
    console.log('✅ Coluna seller_id adicionada à tabela leads');

    // 2. Criar índice
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_seller ON leads(seller_id);
    `);
    console.log('✅ Índice criado');
    
    // 3. Adicionar FK para sellers (pode falhar se sellers não existir ainda)
    try {
      await pool.query(`
        ALTER TABLE leads ADD CONSTRAINT fk_leads_seller 
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key criada');
    } catch (e) {
      console.log('⚠️ FK não criada (tabela sellers pode não estar pronta):', e.message);
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();

