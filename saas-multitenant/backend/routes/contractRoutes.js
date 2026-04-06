const express = require('express');
const router = express.Router();
const contractModel = require('../models/contractModels');
const { checkPermission } = require('../middlewares/checkPermission');

// GET /contracts/aprs-stats - Estatísticas de APRs por estágio (ANTES de /:id)
router.get('/aprs-stats', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const stats = await contractModel.getAPRsByStage(tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Erro ao buscar APRs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /contracts - Buscar todos os contratos do tenant
router.get('/', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const contracts = await contractModel.getAllContracts(tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /contracts/client/:clientId
router.get('/client/:clientId', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const tenantId = req.tenantId;
    const contracts = await contractModel.getContractsByClient(clientId, tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos do cliente:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /contracts/service/:serviceId
router.get('/service/:serviceId', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const tenantId = req.tenantId;
    const contracts = await contractModel.getContractsByService(serviceId, tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /contracts
router.post('/', checkPermission('contracts:create'), async (req, res) => {
  try {
    const data = req.body;
    const tenantId = req.tenantId;
    const contract = await contractModel.createContract({ ...data, tenant_id: tenantId });
    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /contracts/:id
router.put('/:id', checkPermission('contracts:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const tenantId = req.tenantId;
    const contract = await contractModel.updateContract(id, data, tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /contracts/:id
router.delete('/:id', checkPermission('contracts:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const contract = await contractModel.deleteContract(id, tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /contracts/:id (SEMPRE POR ÚLTIMO)
router.get('/:id', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const contract = await contractModel.getContractById(id, tenantId);
    if (!contract) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;