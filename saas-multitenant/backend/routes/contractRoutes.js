const express = require('express');
const router = express.Router();
const contractModel = require('../models/contractModels');
const { checkPermission } = require('../middlewares/checkPermission');
const activityLog = require('../services/activityLogService');

// GET /api/contracts - Listar todos os contratos
router.get('/', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, organ, client_id, vehicle_plate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (organ) filters.organ = organ;
    if (client_id) filters.client_id = client_id;
    if (vehicle_plate) filters.vehicle_plate = vehicle_plate;
    
    const contracts = await contractModel.getContractsByFilter(tenantId, filters);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/stats - Estatísticas de contratos
router.get('/stats', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    const byStatus = await contractModel.getContractsByStatus(tenantId);
    const byOrgan = await contractModel.getContractsByOrgan(tenantId);
    const dashboard = await contractModel.getDashboardStats(tenantId);
    
    res.json({ 
      success: true, 
      data: { 
        byStatus, 
        byOrgan,
        dashboard 
      } 
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/dashboard - Dashboard stats
router.get('/dashboard', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const stats = await contractModel.getDashboardStats(tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Erro ao buscar dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/by-organ - Contratos agrupados por órgão
router.get('/by-organ', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const contracts = await contractModel.getContractsGroupedByOrgan(tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos por órgão:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/alerts - Alertas de contratos
router.get('/alerts', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const alerts = await contractModel.getAlerts(tenantId);
    res.json({ success: true, data: alerts });
  } catch (err) {
    console.error('Erro ao buscar alertas:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/near-due - Contratos próximos ao vencimento
router.get('/near-due', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { days } = req.query;
    const contracts = await contractModel.getContractsNearDueDate(tenantId, parseInt(days) || 30);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos próximos ao vencimento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/overdue - Contratos vencidos
router.get('/overdue', checkPermission('contracts:read'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const contracts = await contractModel.getOverdueContracts(tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos vencidos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/client/:clientId - Buscar contratos por cliente
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

// GET /api/contracts/service/:serviceId - Buscar contratos por serviço
router.get('/service/:serviceId', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const tenantId = req.tenantId;
    
    const contracts = await contractModel.getContractsByService(serviceId, tenantId);
    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error('Erro ao buscar contratos do serviço:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/:id - Buscar contrato por ID
router.get('/:id', checkPermission('contracts:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const contract = await contractModel.getContractById(id, tenantId);
    
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro ao buscar contrato:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contracts - Criar novo contrato
router.post('/', checkPermission('contracts:create'), async (req, res) => {
  try {
    const { 
      client_id, service_id, organ, process_number, contract_number,
      infraction_type, vehicle_plate, vehicle_model, status, value, 
      due_date, notes, numero_multa, deadline_date
    } = req.body;
    const tenantId = req.tenantId;
    
    if (!client_id) {
      return res.status(400).json({ success: false, error: 'Cliente é obrigatório' });
    }
    
    if (!organ) {
      return res.status(400).json({ success: false, error: 'Órgão é obrigatório' });
    }
    
    const contract = await contractModel.createContract({
      tenant_id: tenantId,
      client_id,
      service_id,
      organ,
      process_number,
      contract_number,
      infraction_type,
      vehicle_plate,
      vehicle_model,
      status: status || 'ativo',
      value: value || 0,
      due_date,
      notes,
      numero_multa,
      deadline_date
    });
    
    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro ao criar contrato:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/contracts/:id - Atualizar contrato
router.put('/:id', checkPermission('contracts:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      organ, process_number, contract_number,
      infraction_type, vehicle_plate, vehicle_model, status, value, 
      due_date, notes 
    } = req.body;
    const tenantId = req.tenantId;
    
    const existingContract = await contractModel.getContractById(id, tenantId);
    
    if (!existingContract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    
    const contract = await contractModel.updateContract(id, {
      organ,
      process_number,
      contract_number,
      infraction_type,
      vehicle_plate,
      vehicle_model,
      status,
      value,
      due_date,
      notes
    }, tenantId);
    
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro ao atualizar contrato:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/contracts/:id/status - Atualizar status do contrato
router.patch('/:id/status', checkPermission('contracts:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status é obrigatório' });
    }
    
    const validStatuses = ['ativo', 'inativo', 'concluido', 'cancelado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }
    
    const contract = await contractModel.updateContractStatus(id, status, tenantId);
    
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/contracts/:id - Deletar contrato
router.delete('/:id', checkPermission('contracts:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const contract = await contractModel.deleteContract(id, tenantId);
    
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    
    res.json({ success: true, data: contract, message: 'Contrato deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar contrato:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

