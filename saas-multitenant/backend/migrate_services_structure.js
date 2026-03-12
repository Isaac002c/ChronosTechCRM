/**
 * Script de Migração - Nova Estrutura: Clients -> Services -> Contracts
 * Execute: node backend/migrate_services_structure.js
 */

const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Iniciando migração da nova estrutura...\n');

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Banco de dados conectado');

    // 1. Criar tabela services
    console.log('\n📦 Criando tabela services...');
    const servicesExists = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'services'
    `);

    if (servicesExists.rows.length === 0) {
      await pool.query(`
        CREATE TABLE services (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX idx_services_client ON services(client_id)`);
      await pool.query(`CREATE INDEX idx_services_tenant ON services(tenant_id)`);
      console.log('✅ Tabela services criada');
    } else {
      console.log('ℹ️  Tabela services já existe');
    }

    // 2. Adicionar campos na tabela contracts
    console.log('\n📦 Atualizando tabela contracts...');
    
    // Verificar e adicionar campo service_id
    const hasServiceId = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'service_id'
    `);
    
    if (hasServiceId.rows.length === 0) {
      await pool.query(`
        ALTER TABLE contracts ADD COLUMN service_id UUID REFERENCES services(id) ON DELETE SET NULL
      `);
      console.log('✅ Campo service_id adicionado');
    } else {
      console.log('ℹ️  Campo service_id já existe');
    }

    // Verificar e adicionar campo numero_multa
    const hasNumeroMulta = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'numero_multa'
    `);
    
    if (hasNumeroMulta.rows.length === 0) {
      await pool.query(`
        ALTER TABLE contracts ADD COLUMN numero_multa VARCHAR(100)
      `);
      console.log('✅ Campo numero_multa adicionado');
    } else {
      console.log('ℹ️  Campo numero_multa já existe');
    }

    // Verificar e adicionar campo deadline_date
    const hasDeadlineDate = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'deadline_date'
    `);
    
    if (hasDeadlineDate.rows.length === 0) {
      await pool.query(`
        ALTER TABLE contracts ADD COLUMN deadline_date DATE
      `);
      console.log('✅ Campo deadline_date adicionado');
    } else {
      console.log('ℹ️  Campo deadline_date já existe');
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📋 Estrutura criada:');
    console.log('   - services: id, tenant_id, client_id, name, created_at, updated_at');
    console.log('   - contracts: +service_id, +numero_multa, +deadline_date');

  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

