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
        const { name, email, phone, company, status, source } = req.body;
        const tenantId = req.tenantId;
        
        if (!name || !email) {
            return res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        }
        
        const lead = await leadModel.createLead({
            name,
            email,
            phone,
            company,
            status,
            source,
            tenant_id: tenantId
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
        const { name, email, phone, company, status, source } = req.body;
        const tenantId = req.tenantId;
        
        const lead = await leadModel.updateLead(id, {
            name,
            email,
            phone,
            company,
            status,
            source
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

