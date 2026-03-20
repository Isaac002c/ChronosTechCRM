/**
 * Script de Migração - FASE 3: Estrutura SaaS
 * Cria as tabelas: plans, company_plans, activity_logs
 * Execute: node backend/setup_saas_module.js
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
-- FASE 3 - ESTRUTURA SAAS
-- ============================================

-- 1. Tabela de PLANOS (plans)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,           -- Free, Basic, Professional, Enterprise
    description TEXT,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    yearly_price DECIMAL(10,2) DEFAULT 0,
    max_clients INTEGER DEFAULT 0,        -- 0 = ilimitado
    max_contracts INTEGER DEFAULT 0,       -- 0 = ilimitado
    max_users INTEGER DEFAULT 1,           -- usuários por empresa
    features JSONB,                        -- funcionalidades habilitadas
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de ASSINATURAS (company_plans)
CREATE TABLE IF NOT EXISTS company_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'trial',    -- trial, active, cancelled, expired
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de LOGS DE ATIVIDADES (activity_logs)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,          -- created, updated, deleted, login, etc
    entity_type VARCHAR(50) NOT NULL,      -- client, contract, document, user
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_plans_tenant ON company_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_plans_status ON company_plans(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- PLANOS PADRÃO
-- ============================================

INSERT INTO plans (name, description, monthly_price, yearly_price, max_clients, max_contracts, max_users, features, is_active) VALUES
('Free', 'Plano gratuito para testes', 0, 0, 10, 10, 1, '{"leads": true, "multas": true, "reports": false, "export": false}'::jsonb, true),
('Basic', 'Plano básico para pequenas empresas', 49.90, 499.00, 100, 100, 3, '{"leads": true, "multas": true, "reports": true, "export": true}'::jsonb, true),
('Professional', 'Plano profissional completo', 99.90, 999.00, 500, 500, 10, '{"leads": true, "multas": true, "reports": true, "export": true, "api": true}'::jsonb, true),
('Enterprise', 'Plano enterprise para grandes empresas', 0, 0, 0, 0, 100, '{"leads": true, "multas": true, "reports": true, "export": true, "api": true, "custom": true}'::jsonb, true)
ON CONFLICT DO NOTHING;
`;

async function setupSaasModule() {
  console.log('🔄 Conectando ao banco de dados...');
  
  try {
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', test.rows[0]);
    
    console.log('🔄 Criando tabelas do módulo SaaS...');
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar tabelas criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('plans', 'company_plans', 'activity_logs')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas do módulo SaaS:');
    tables.rows.forEach(t => console.log('  ✓ ' + t.table_name));
    
    // Verificar planos criados
    const plans = await pool.query('SELECT name, monthly_price, max_clients FROM plans ORDER BY name');
    console.log('\n📋 Planos disponíveis:');
    plans.rows.forEach(p => console.log(`  - ${p.name}: R$ ${p.monthly_price}/${p.max_clients} clientes`));
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhe:', err.stack);
  } finally {
    await pool.end();
  }
}

setupSaasModule();

