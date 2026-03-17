/**
 * Migração: Adicionar campos faltantes na tabela clients (birth_date, first_cnh, address, notes)
 * Fix para erro "column birth_date does not exist" ao editar cliente
 * Execute: cd saas-multitenant/backend && node migrate_add_client_fields.js
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
  console.log('🔄 Iniciando migração para tabela clients...');
  
  try {
    // Testar conexão
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão OK:', test.rows[0]);
    
    // 1. birth_date
    console.log('🔄 Adicionando birth_date...');
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  birth_date já existe');
      } else throw err;
    });
    console.log('✅ birth_date adicionada');
    
    // 2. first_cnh
    console.log('🔄 Adicionando first_cnh...');
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_cnh DATE;
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  first_cnh já existe');
      } else throw err;
    });
    console.log('✅ first_cnh adicionada');
    
    // 3. address
    console.log('🔄 Adicionando address...');
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  address já existe');
      } else throw err;
    });
    console.log('✅ address adicionada');
    
    // 4. notes
    console.log('🔄 Adicionando notes...');
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
    `).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  notes já existe');
      } else throw err;
    });
    console.log('✅ notes adicionada');
    
    // Índices opcionais
    console.log('🔄 Criando índices...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_clients_birth_date ON clients(birth_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_clients_first_cnh ON clients(first_cnh)`);
    console.log('✅ Índices criados');
    
    // Verificar
    const verify = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND column_name IN ('birth_date', 'first_cnh', 'address', 'notes')
      ORDER BY column_name;
    `);
    console.log('📋 Colunas verificadas:', verify.rows);
    
    console.log('\n🎉 Migração concluída! Agora editar clientes com birth_date funcionará.');
    
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
