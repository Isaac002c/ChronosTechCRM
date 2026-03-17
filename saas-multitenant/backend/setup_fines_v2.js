/**
 * Script de Migração - Módulo de Multas V2
 * Cria as tabelas: fines, fine_documents, fine_logs
 * Execute: node backend/setup_fines_v2.js
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
-- MÓDULO DE MULTAS V2 - TABELAS FINAS
-- ============================================

-- 1. Tabela de MULTAS (fines) - Entidade Principal
CREATE TABLE IF NOT EXISTS fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Identificação da multa
    fine_number VARCHAR(50),           -- Número da infração/multa
    plate VARCHAR(20),                  -- Placa do veículo
    organ VARCHAR(100) NOT NULL,        -- DETRAN, PRF, DER, etc
    infraction_type VARCHAR(100),       -- Tipo de infração
    vehicle_model VARCHAR(100),          -- Modelo do veículo
    
    -- Datas
    infraction_date DATE,                -- Data da infração
    due_date DATE,                      -- Data de vencimento
    defense_date DATE,                  -- Data limite para defesa
    
    -- Status e Estágio
    stage VARCHAR(50) DEFAULT 'cadastro',   -- cadastro, defesa_previa, recurso_1, recurso_2, finalizado
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, aguardando_documento, protocolado, deferido, indeferido, cancelado
    
    -- Valores
    value DECIMAL(15,2) DEFAULT 0,      -- Valor da multa
    cost DECIMAL(15,2) DEFAULT 0,        -- Custo do serviço
    paid_value DECIMAL(15,2) DEFAULT 0,-- Valor pago pelo cliente
    
    -- Relacionamentos
    seller_id UUID REFERENCES users(id),
    
    -- Observações
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de DOCUMENTOS das Multas (fine_documents)
CREATE TABLE IF NOT EXISTS fine_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fine_id UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
    
    -- Documento
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),            -- pdf, jpg, png, etc
    file_size INTEGER,                  -- Tamanho em bytes
    category VARCHAR(50),               -- defesa, recurso, comprovante, outro
    
    -- Controle
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de LOGS/Histórico das Multas (fine_logs)
CREATE TABLE IF NOT EXISTS fine_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fine_id UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
    
    -- Ação
    action VARCHAR(100) NOT NULL,      -- created, status_changed, stage_changed, document_added, etc
    field_name VARCHAR(100),            -- Nome do campo alterado
    old_value TEXT,                      -- Valor anterior
    new_value TEXT,                      -- Novo valor
    
    -- Usuário
    user_id UUID REFERENCES users(id),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices de fines
CREATE INDEX IF NOT EXISTS idx_fines_tenant ON fines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fines_client ON fines(client_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_stage ON fines(stage);
CREATE INDEX IF NOT EXISTS idx_fines_organ ON fines(organ);
CREATE INDEX IF NOT EXISTS idx_fines_plate ON fines(plate);
CREATE INDEX IF NOT EXISTS idx_fines_due_date ON fines(due_date);
CREATE INDEX IF NOT EXISTS idx_fines_seller ON fines(seller_id);

-- Índices de fine_documents
CREATE INDEX IF NOT EXISTS idx_fine_documents_tenant ON fine_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fine_documents_fine ON fine_documents(fine_id);
CREATE INDEX IF NOT EXISTS idx_fine_documents_category ON fine_documents(category);

-- Índices de fine_logs
CREATE INDEX IF NOT EXISTS idx_fine_logs_tenant ON fine_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fine_logs_fine ON fine_logs(fine_id);
CREATE INDEX IF NOT EXISTS idx_fine_logs_action ON fine_logs(action);
CREATE INDEX IF NOT EXISTS idx_fine_logs_created ON fine_logs(created_at);
`;

async function setupFinesV2() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    // Verificar se uuid_generate_v4 existe
    await pool.query('SELECT uuid_generate_v4()');
    console.log('✅ Extensão uuid-ossp disponível');
    
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Criando tabelas do Módulo de Multas V2...');
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('fines', 'fine_documents', 'fine_logs')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas do Módulo de Multas V2:');
    tables.rows.forEach(t => console.log('  ✓ ' + t.table_name));
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('  1. Criar models: fineModels.js, fineDocumentModels.js, fineLogModels.js');
    console.log('  2. Criar routes: finesRoutes.js');
    console.log('  3. Criar frontend: finesAPI.js, novas páginas');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhe:', err.stack);
  } finally {
    await pool.end();
  }
}

setupFinesV2();

