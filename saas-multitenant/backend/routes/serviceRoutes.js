const express = require('express');
const router = express.Router();
const serviceModel = require('../models/serviceModels');

// GET /api/services - Listar todos os serviços
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const services = await serviceModel.getAllServices(tenantId);
    res.json({ success: true, data: services });
  } catch (err) {
    console.error('Erro ao buscar serviços:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/services/client/:clientId - Listar serviços por cliente
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const tenantId = req.tenantId;
    
    const services = await serviceModel.getServicesByClient(clientId, tenantId);
    res.json({ success: true, data: services });
  } catch (err) {
    console.error('Erro ao buscar serviços do cliente:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/services/:id - Buscar serviço por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const service = await serviceModel.getServiceById(id, tenantId);
    
    if (!service) {
      return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    }
    
    res.json({ success: true, data: service });
  } catch (err) {
    console.error('Erro ao buscar serviço:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services - Criar novo serviço
router.post('/', async (req, res) => {
  try {
    const { client_id, name } = req.body;
    const tenantId = req.tenantId;
    
    if (!client_id) {
      return res.status(400).json({ success: false, error: 'Cliente é obrigatório' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome do serviço é obrigatório' });
    }
    
    const service = await serviceModel.createService({
      tenant_id: tenantId,
      client_id,
      name
    });
    
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    console.error('Erro ao criar serviço:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/services/:id - Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantId = req.tenantId;
    
    const existingService = await serviceModel.getServiceById(id, tenantId);
    
    if (!existingService) {
      return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    }
    
    const service = await serviceModel.updateService(id, { name }, tenantId);
    
    res.json({ success: true, data: service });
  } catch (err) {
    console.error('Erro ao atualizar serviço:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/services/:id - Deletar serviço
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const service = await serviceModel.deleteService(id, tenantId);
    
    if (!service) {
      return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    }
    
    res.json({ success: true, data: service, message: 'Serviço deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar serviço:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

