/**
 * Script Simplificado de Migração - Adicionar colunas na tabela users
 * Execute: node migrate_users_columns.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  console.log('🔄 Iniciando migração...');
  
  try {
    // Testar conexão primeiro
    console.log('🔄 Testando conexão com o banco...');
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão OK:', test.rows[0]);
    
    // 1. Adicionar coluna role
    console.log('🔄 Adicionando coluna role...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'seller'
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Coluna role já existe');
      } else throw err;
    });
    console.log('✅ Coluna role adicionada');
    
    // 2. Adicionar coluna seller_id
    console.log('🔄 Adicionando coluna seller_id...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Coluna seller_id já existe');
      } else throw err;
    });
    console.log('✅ Coluna seller_id adicionada');
    
    // 3. Criar índices
    console.log('🔄 Criando índices...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_seller_id ON users(seller_id)`);
    console.log('✅ Índices criados');
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
