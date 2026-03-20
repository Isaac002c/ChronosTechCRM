'use client';

import { useState, useEffect } from 'react';
import { 
  getFines,
  createFine,
  updateFine,
  deleteFine,
  updateFineStatus
} from '../lib/finesAPI';
import { getClients } from '../lib/clientsAPI';
import { getFineDocuments } from '../lib/finesAPI';

export default function MultasContracts() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractDocuments, setContractDocuments] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    organ: '',
    vehicle_plate: ''
  });

  const [formData, setFormData] = useState({
    client_id: '',
    organ: '',
    process_number: '',
    contract_number: '',
    infraction_type: '',
    vehicle_plate: '',
    vehicle_model: '',
    status: 'ativo',
    value: '',
    due_date: '',
    notes: ''
  });

  // Lista de órgãos常见的
  const organs = ['DETRAN', 'DER', 'PRF', 'CET', 'DETRAN-SP', 'OUTROS'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [finesData, clientsData] = await Promise.all([
        getFines(filters),
        getClients()
      ]);
      setContracts(finesData);
      setClients(clientsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    loadData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Tratamento especial para due_date - não enviar string vazia
      const contractData = {
        client_id: formData.client_id,
        organ: formData.organ,
        process_number: formData.process_number || null,
        contract_number: formData.contract_number || null,
        infraction_type: formData.infraction_type || null,
        vehicle_plate: formData.vehicle_plate || null,
        vehicle_model: formData.vehicle_model || null,
        status: formData.status,
        value: formData.value ? parseFloat(formData.value) : 0,
        // Se due_date for vazio, envie null, senão envie a data
        due_date: formData.due_date ? formData.due_date : null,
        notes: formData.notes || null
      };
      
      if (editingContract) {
        await updateContract(editingContract.id, contractData);
      } else {
        await createContract(contractData);
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      setError(err.message);
    }
  };

  const handleEdit = async (contract) => {
    setEditingContract(contract);
    setFormData({
      client_id: contract.client_id || '',
      organ: contract.organ || '',
      process_number: contract.process_number || '',
      contract_number: contract.contract_number || '',
      infraction_type: contract.infraction_type || '',
      vehicle_plate: contract.vehicle_plate || '',
      vehicle_model: contract.vehicle_model || '',
      status: contract.status || 'ativo',
      value: contract.value || '',
      due_date: contract.due_date || '',
      notes: contract.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        await deleteContract(id);
        loadData();
      } catch (err) {
        console.error('Erro ao deletar contrato:', err);
        setError(err.message);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateContractStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError(err.message);
    }
  };

  const handleViewDocuments = async (contract) => {
    setSelectedContract(contract);
    try {
      const docs = await getDocumentsByContract(contract.id);
      setContractDocuments(docs);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      organ: '',
      process_number: '',
      contract_number: '',
      infraction_type: '',
      vehicle_plate: '',
      vehicle_model: '',
      status: 'ativo',
      value: '',
      due_date: '',
      notes: ''
    });
  };

  const openNewContractModal = () => {
    setEditingContract(null);
    resetForm();
    setShowModal(true);
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'ativo': 'status-active',
      'inativo': 'status-inactive',
      'concluido': 'status-completed',
      'cancelado': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando contratos...</p>
      </div>
    );
  }

  return (
    <div className="multas-contracts">
      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Órgão</label>
          <select 
            value={filters.organ} 
            onChange={(e) => handleFilterChange('organ', e.target.value)}
          >
            <option value="">Todos</option>
            {organs.map(organ => (
              <option key={organ} value={organ}>{organ}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Placa</label>
          <input
            type="text"
            placeholder="Buscar por placa..."
            value={filters.vehicle_plate}
            onChange={(e) => handleFilterChange('vehicle_plate', e.target.value)}
          />
        </div>
        <button onClick={applyFilters} className="btn-filter">
          Filtrar
        </button>
        <button onClick={openNewContractModal} className="btn-primary">
          + Novo Contrato
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>[X]</button>
        </div>
      )}

      {/* Tabela de Contratos */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Órgão</th>
              <th>Placa</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Nenhum contrato encontrado
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>
                    <div className="contract-info">
                      <strong>{contract.contract_number || '-'}</strong>
                      {contract.process_number && (
                        <span className="process-number">Processo: {contract.process_number}</span>
                      )}
                    </div>
                  </td>
                  <td>{contract.client_name || '-'}</td>
                  <td>{contract.organ}</td>
                  <td>{contract.vehicle_plate || '-'}</td>
                  <td>{formatCurrency(contract.value)}</td>
                  <td>
                    <select
                      value={contract.status}
                      onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                      className={`status-select ${getStatusBadgeClass(contract.status)}`}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleViewDocuments(contract)}
                      className="btn-icon"
                      title="Ver Documentos"
                    >
                      [Doc]
                    </button>
                    <button 
                      onClick={() => handleEdit(contract)}
                      className="btn-icon"
                      title="Editar"
                    >
                      [Editar]
                    </button>
                    <button 
                      onClick={() => handleDelete(contract.id)}
                      className="btn-icon danger"
                      title="Excluir"
                    >
                      [X]
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Contrato */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">[X]</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Órgão *</label>
                  <select
                    value={formData.organ}
                    onChange={(e) => setFormData({...formData, organ: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    {organs.map(organ => (
                      <option key={organ} value={organ}>{organ}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nº do Contrato</label>
                  <input
                    type="text"
                    value={formData.contract_number}
                    onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Nº do Processo</label>
                  <input
                    type="text"
                    value={formData.process_number}
                    onChange={(e) => setFormData({...formData, process_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Placa do Veículo</label>
                  <input
                    type="text"
                    value={formData.vehicle_plate}
                    onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})}
                    maxLength={7}
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="form-group">
                  <label>Modelo do Veículo</label>
                  <input
                    type="text"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Infração</label>
                  <input
                    type="text"
                    value={formData.infraction_type}
                    onChange={(e) => setFormData({...formData, infraction_type: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingContract ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Documentos */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Documentos do Contrato</h2>
              <button onClick={() => setSelectedContract(null)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Contrato:</strong> {selectedContract.contract_number || '-'}</p>
              <p><strong>Cliente:</strong> {selectedContract.client_name}</p>
              
              {contractDocuments.length === 0 ? (
                <p className="empty-state">Nenhum documento anexado</p>
              ) : (
                <div className="documents-list">
                  {contractDocuments.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <span className="doc-icon">[Doc]</span>
                      <span className="doc-name">{doc.file_name}</span>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="doc-link">
                        Visualizar
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

