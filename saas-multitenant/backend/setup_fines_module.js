/**
 * Script de Migração - Módulo de Multas
 * Cria as tabelas: companies, clients, contracts, documents
 * Execute: node backend/setup_fines_module.js
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
-- ============================================
-- MÓDULO DE MULTAS - TABELAS BASE
-- ============================================

-- 1. Tabela de EMPRESAS (companies)
-- Nota: Vamos usar a tabela tenants existente como base
-- e criar uma tabela companies para representar clientes/empresas do módulo de multas

-- 2. Tabela de CLIENTES (clients) - Proprietários de veículos
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cnh VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de CONTRATOS (contracts) - Contratos de multas
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    organ VARCHAR(100) NOT NULL,  -- DETRAN, DER, etc
    process_number VARCHAR(50),  -- Número do processo
    contract_number VARCHAR(50), -- Número do contrato
    infraction_type VARCHAR(100), -- Tipo de infração
    vehicle_plate VARCHAR(20),   -- Placa do veículo
    vehicle_model VARCHAR(100),  -- Modelo do veículo
    status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, concluido, cancelado
    value DECIMAL(15,2) DEFAULT 0, -- Valor do contrato
    due_date DATE,               -- Data de vencimento
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de DOCUMENTOS (documents)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),       -- pdf, jpg, png, etc
    file_size INTEGER,           -- Tamanho em bytes
    category VARCHAR(50),        -- contrato, documento, foto, etc
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_organ ON contracts(organ);
CREATE INDEX IF NOT EXISTS idx_contracts_plate ON contracts(vehicle_plate);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_contract ON documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
`;

async function setupFinesModule() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Criando tabelas do módulo de multas...');
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('clients', 'contracts', 'documents')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas do módulo de multas:');
    tables.rows.forEach(t => console.log('  ✓ ' + t.table_name));
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhe:', err.stack);
  } finally {
    await pool.end();
  }
}

setupFinesModule();

