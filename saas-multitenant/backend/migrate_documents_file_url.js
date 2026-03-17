/**
 * Migração: Aumentar limite do campo file_url na tabela documents
 * Execute: node migrate_documents_file_url.js
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
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida');
    
    // Verificar tipo atual da coluna
    const columnCheck = await pool.query(`
      SELECT data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'file_url'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('ℹ️  Tipo atual:', columnCheck.rows[0].data_type, columnCheck.rows[0].character_maximum_length);
    }
    
    // Alterar para TEXT (sem limite)
    console.log('🔄 Alterando campo file_url para TEXT...');
    await pool.query(`
      ALTER TABLE documents ALTER COLUMN file_url TYPE TEXT
    `);
    
    console.log('✅ Campo file_url alterado para TEXT com sucesso!');
    console.log('\n🎉 Migração concluída!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
