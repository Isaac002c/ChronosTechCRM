/**
 * Script de Migração - Adicionar coluna role à tabela users
 * Execute: node backend/migrate_add_user_role.js
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
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    // Verificar se a coluna role existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('\n📝 Adicionando coluna "role" à tabela users...');
      await pool.query(`
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'viewer'
      `);
      console.log('✅ Coluna "role" adicionada com sucesso!');
    } else {
      console.log('\nℹ️  Coluna "role" já existe na tabela users.');
    }
    
    // Verificar se a coluna tenant_id existe
    const checkTenant = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'tenant_id'
    `);
    
    if (checkTenant.rows.length === 0) {
      console.log('\n📝 Adicionando coluna "tenant_id" à tabela users...');
      await pool.query(`
        ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
      `);
      console.log('✅ Coluna "tenant_id" adicionada com sucesso!');
    } else {
      console.log('\nℹ️  Coluna "tenant_id" já existe na tabela users.');
    }
    
    // Mostrar estrutura da tabela
    console.log('\n📋 Estrutura atual da tabela users:');
    const columns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? '(default: ' + col.column_default + ')' : ''}`);
    });
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

