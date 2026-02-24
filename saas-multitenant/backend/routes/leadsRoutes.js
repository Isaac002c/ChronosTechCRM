const express = require('express');
const router = express.Router();
const leadModel = require('../models/leadModels');

// GET /api/leads - Listar todos os leads do tenant
router.get('/', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const leads = await leadModel.getAllLeads(tenantId);
        res.json({ success: true, data: leads });
    } catch (err) {
        console.error('Erro ao buscar leads:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/leads/stats - Métricas de leads
router.get('/stats', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const byStatus = await leadModel.getLeadsCountByStatus(tenantId);
        const bySource = await leadModel.getLeadsCountBySource(tenantId);
        const allLeads = await leadModel.getAllLeads(tenantId);
        
        res.json({
            success: true,
            data: {
                total: allLeads.length,
                byStatus,
                bySource
            }
        });
    } catch (err) {
        console.error('Erro ao buscar stats:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/leads/pipeline - Métricas financeiras do pipeline
router.get('/pipeline', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const metrics = await leadModel.getPipelineMetrics(tenantId);
        res.json({ success: true, data: metrics });
    } catch (err) {
        console.error('Erro ao buscar pipeline:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/leads/monthly - Métricas mensais (histórico)
router.get('/monthly', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const months = parseInt(req.query.months) || 12;
        const metrics = await leadModel.getMonthlyMetrics(tenantId, months);
        res.json({ success: true, data: metrics });
    } catch (err) {
        console.error('Erro ao buscar métricas mensais:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/leads/:id - Buscar lead por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        const lead = await leadModel.getLeadById(id, tenantId);
        
        if (!lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado' });
        }
        
        res.json({ success: true, data: lead });
    } catch (err) {
        console.error('Erro ao buscar lead:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/leads - Criar novo lead
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, company, value, status, source, stage, seller_id } = req.body;
        const tenantId = req.tenantId;
        
        // DEBUG: Log para rastrear tenant_id
        console.log('[leadsRoutes] POST / - tenantId:', tenantId, 'type:', typeof tenantId);
        console.log('[leadsRoutes] body:', JSON.stringify(req.body));
        
        if (!tenantId) {
            console.error('[leadsRoutes] ERRO: tenantId não encontrado em req.tenantId!');
            return res.status(401).json({ success: false, error: 'Tenant não identificado. Faça login novamente.' });
        }
        
        if (!name || !email) {
            return res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        }
        
        const lead = await leadModel.createLead({
            name,
            email,
            phone,
            company,
            value: value || 0,
            status,
            source,
            stage: stage || 'lead',
            tenant_id: tenantId,
            seller_id: seller_id || null
        });
        
        res.status(201).json({ success: true, data: lead });
    } catch (err) {
        console.error('Erro ao criar lead:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/leads/:id - Atualizar lead
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company, value, status, source, stage, seller_id } = req.body;
        const tenantId = req.tenantId;
        
        const lead = await leadModel.updateLead(id, {
            name,
            email,
            phone,
            company,
            value: value || 0,
            status,
            source,
            stage: stage || 'lead',
            seller_id: seller_id || null
        }, tenantId);
        
        if (!lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado' });
        }
        
        res.json({ success: true, data: lead });
    } catch (err) {
        console.error('Erro ao atualizar lead:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/leads/:id - Deletar lead
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        
        const lead = await leadModel.deleteLead(id, tenantId);
        
        if (!lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado' });
        }
        
        res.json({ success: true, data: lead, message: 'Lead deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar lead:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
