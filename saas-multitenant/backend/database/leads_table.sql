-- Script para criar a tabela de leads no PostgreSQL/Supabase
-- Execute este SQL no seu banco de dados Supabase

-- 1. Criar tabela leads (usando UUID conforme padrão Supabase)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'novo',  -- novo, contactado, qualificado, proposta, ganho, perdido
    source VARCHAR(100),  -- site, google, indicacao, linkedin, etc
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. Policy: tenants só veem seus próprios leads
CREATE POLICY "Tenant can only see own leads" ON leads
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

