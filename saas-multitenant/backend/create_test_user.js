/**
 * Script para criar um usuário de teste
 * Execute: node create_test_user.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');
  
  try {
    // 1. Criar tenant
    const tenantResult = await pool.query(
      'INSERT INTO tenants(name) VALUES($1) RETURNING *',
      ['Empresa Teste']
    );
    const tenant = tenantResult.rows[0];
    console.log('✅ Tenant criado:', tenant);

    // 2. Criar usuário
    const hashedPassword = await bcrypt.hash('teste123', 10);
    const userResult = await pool.query(
      'INSERT INTO users(name, email, password_hash, tenant_id) VALUES($1, $2, $3, $4) RETURNING *',
      ['Usuario Teste', 'teste@exemplo.com', hashedPassword, tenant.id]
    );
    const user = userResult.rows[0];
    console.log('✅ Usuário criado:', user.email);
    console.log('   Senha: teste123');
    console.log('   Tenant ID:', tenant.id);

    console.log('\n📝 Dados para login:');
    console.log('   Email: teste@exemplo.com');
    console.log('   Senha: teste123');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

createTestUser();

