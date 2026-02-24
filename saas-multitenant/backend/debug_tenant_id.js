/**
 * Script de Debug e Correção do tenant_id na tabela leads
 * Execute: node debug_tenant_id.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugTenantId() {
  console.log('🔍 === DEBUG TENANT_ID ===\n');
  
  try {
    // 1. Verificar estrutura da tabela leads
    console.log('1️⃣ Verificando estrutura da tabela leads...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colunas da tabela leads:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} | nullable: ${col.is_nullable} | default: ${col.column_default || 'none'}`);
    });

    // 2. Verificar se tenant_id é NOT NULL
    const tenantIdCol = tableInfo.rows.find(c => c.column_name === 'tenant_id');
    if (tenantIdCol) {
      console.log(`\n✅ Coluna tenant_id existe: ${tenantIdCol.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    } else {
      console.log('\n❌ ERRO: Coluna tenant_id NÃO existe na tabela leads!');
    }

    // 3. Verificar se há leads sem tenant_id
    console.log('\n2️⃣ Verificando leads sem tenant_id...');
    const nullTenant = await pool.query(`
      SELECT id, name, created_at 
      FROM leads 
      WHERE tenant_id IS NULL 
      LIMIT 10
    `);
    
    if (nullTenant.rows.length > 0) {
      console.log(`⚠️  Encontrados ${nullTenant.rows.length} leads sem tenant_id:`);
      nullTenant.rows.forEach(l => console.log(`   - ${l.name} (${l.id})`));
    } else {
      console.log('✅ Nenhum lead sem tenant_id encontrado');
    }

    // 4. Verificar se tenants existem
    console.log('\n3️⃣ Verificando tenants...');
    const tenants = await pool.query('SELECT id, name, created_at FROM tenants LIMIT 5');
    if (tenants.rows.length === 0) {
      console.log('❌ ERRO: Nenhum tenant encontrado! Crie um tenant primeiro.');
    } else {
      console.log(`✅ ${tenants.rows.length} tenants encontrados:`);
      tenants.rows.forEach(t => console.log(`   - ${t.name} (${t.id})`));
    }

    // 5. Verificar usuários
    console.log('\n4️⃣ Verificando usuários...');
    const users = await pool.query(`
      SELECT u.id, u.name, u.email, u.tenant_id, t.name as tenant_name
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id
      LIMIT 5
    `);
    
    if (users.rows.length === 0) {
      console.log('❌ ERRO: Nenhum usuário encontrado!');
    } else {
      console.log(`✅ ${users.rows.length} usuários encontrados:`);
      users.rows.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - tenant: ${u.tenant_name || 'SEM TENANT!'}`);
      });
    }

    // 6. Verificar se tenant_id está sendo passado corretamente nos inserts
    console.log('\n5️⃣ Testando INSERT com tenant_id...');
    if (tenants.rows.length > 0 && users.rows.length > 0) {
      const testTenantId = tenants.rows[0].id;
      
      try {
        const testInsert = await pool.query(`
          INSERT INTO leads(name, email, tenant_id) 
          VALUES($1, $2, $3) 
          RETURNING id, name, tenant_id
        `, ['TESTE_DEBUG', 'teste@debug.com', testTenantId]);
        
        console.log('✅ INSERT funcionou!', testInsert.rows[0]);
        
        // Cleanup - deletar lead de teste
        await pool.query('DELETE FROM leads WHERE name = $1', ['TESTE_DEBUG']);
        console.log('🧹 Lead de teste removido');
        
      } catch (insertErr) {
        console.log('❌ ERRO no INSERT:', insertErr.message);
      }
    }

    console.log('\n🔍 === FIM DO DEBUG ===\n');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    await pool.end();
  }
}

debugTenantId();
