'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClientById } from '../../../lib/clientsAPI';
import { getServicesByClient, createService, deleteService } from '../../../lib/servicesAPI';
import { getContractsByService, createContract, updateContract, deleteContract } from '../../../lib/contractsAPI';

// Constantes para dropdowns
const SERVICE_TYPES = ['Crci', 'multa', 'suspensão', 'cassação', 'revisão de atos', 'processo'];
const MULTA_STATUSES = [
  'Aprs. Defesa Prévia',
  'Defesa prévia - analise',
  'Aprs 1 Instancia',
  '1 instancia - analise',
  'aprs 2 instancia',
  '2 instancia -analise'
];
const PROCESSO_TIPOS = ['Dentran', 'Der', 'Dnit', 'Smtr', 'Renainf', 'PMRJ', 'Prefeitura UF'];

export default function ClientDetail() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modais
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  
  // Edit state
  const [editingContract, setEditingContract] = useState(null);
  
  // Formulário de Serviço
  const [selectedServiceType, setSelectedServiceType] = useState('');
  
  // Formulário de Contrato
  const [contractForm, setContractForm] = useState({
    numero_multa: '',
    vehicle_plate: '',
    process_number: '',
    organ: '',
    status: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const clientId = params?.id;

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await getClientById(clientId);
      setClient(clientData);
      
      const servicesData = await getServicesByClient(clientId);
      setServices(servicesData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (serviceId) => {
    try {
      setLoadingContracts(true);
      setError(null);
      const contractsData = await getContractsByService(serviceId);
      setContracts(contractsData || []);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
      setError(err.message);
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!selectedServiceType) {
      setError('Selecione um tipo de serviço');
      return;
    }
    try {
      await createService({
        client_id: clientId,
        name: selectedServiceType
      });
      setShowServiceModal(false);
      setSelectedServiceType('');
      loadClientData();
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
      setError(err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Tem certeza que deseja excluir este serviço e todos os seus contratos?')) return;
    try {
      await deleteService(serviceId);
      if (selectedService?.id === serviceId) {
        setSelectedService(null);
        setContracts([]);
      }
      loadClientData();
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
      setError(err.message);
    }
  };

  const handleSelectService = async (service) => {
    setSelectedService(service);
    if (service.id) {
      await loadContracts(service.id);
    }
  };

  const resetContractForm = () => {
    setContractForm({
      numero_multa: '',
      vehicle_plate: '',
      process_number: '',
      organ: '',
      status: ''
    });
  };

  const openContractModal = (contract = null) => {
    setIsEditing(!!contract);
    if (contract) {
      setContractForm({
        numero_multa: contract.numero_multa || '',
        vehicle_plate: contract.vehicle_plate || '',
        process_number: contract.process_number || '',
        organ: contract.organ || '',
        status: contract.status || ''
      });
      setEditingContract(contract);
    } else {
      resetContractForm();
      setEditingContract(null);
    }
    setShowContractModal(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      setError('Selecione um serviço primeiro');
      return;
    }

    const serviceName = selectedService.name?.toLowerCase() || '';
    let payload = {
      service_id: selectedService.id,
      organ: selectedService.name === 'processo' ? contractForm.organ : contractForm.organ || 'DETRAN'
    };

    // Campos condicionais
    if (serviceName === 'multa') {
      if (!contractForm.numero_multa || !contractForm.status) {
        setError('Preencha N da Multa e Status');
        return;
      }
      payload.numero_multa = contractForm.numero_multa;
      payload.vehicle_plate = contractForm.vehicle_plate;
      payload.status = contractForm.status;
    } else if (serviceName === 'processo') {
      if (!contractForm.process_number || !contractForm.organ || !contractForm.status) {
        setError('Preencha N do Processo, Tipo e Status');
        return;
      }
      payload.process_number = contractForm.process_number;
      payload.status = contractForm.status;
    } else {
      if (!contractForm.status) {
        setError('Preencha o Status');
        return;
      }
      payload.status = contractForm.status;
    }

    try {
      if (isEditing && editingContract) {
        await updateContract(editingContract.id, payload);
      } else {
        await createContract({ ...payload, client_id: clientId });
      }
      setShowContractModal(false);
      loadContracts(selectedService.id);
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      setError(err.message);
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    try {
      await deleteContract(contractId);
      loadContracts(selectedService.id);
    } catch (err) {
      console.error('Erro ao deletar contrato:', err);
      setError(err.message);
    }
  };

  const getTableHeaders = () => {
    if (!selectedService) return [];
    const name = selectedService.name?.toLowerCase();
    if (name === 'multa') {
      return ['Nº Multa', 'Placa', 'Status', 'Data', 'Ações'];
    } else if (name === 'processo') {
      return ['N Processo', 'Tipo', 'Status', 'Data', 'Ações'];
    }
    return ['Status', 'Data', 'Ações'];
  };

  const formatCPF = (cpf) => cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4') : '-';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="error-message">
        <p>Cliente não encontrado</p>
        <button onClick={() => router.push('/multas/clients')}>← Voltar aos Clientes</button>
      </div>
    );
  }

  return (
    <div className="client-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => router.back()} className="btn-back">← Voltar</button>
        <span>/ {client.name}</span>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Dados do Cliente */}
      <div className="client-header">
        <h1>{client.name}</h1>
        <div className="client-details">
          <span>CPF: {formatCPF(client.cpf)}</span>
          <span>CNH: {client.cnh || '-'}</span>
          <span>Telefone: {client.phone || '-'}</span>
          <span>Email: {client.email || '-'}</span>
        </div>
      </div>

      {/* Serviços */}
      <div className="services-section">
        <div className="section-header">
          <h2>Serviços</h2>
          <button onClick={() => setShowServiceModal(true)} className="btn-primary">+ Novo Serviço</button>
        </div>
        {services.length === 0 ? (
          <div className="empty-state">Nenhum serviço. Crie um novo!</div>
        ) : (
          <div className="services-list">
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                onClick={() => handleSelectService(service)}
              >
                <div className="service-info">
                  <h3>{service.name}</h3>
                  <small>{new Date(service.created_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                  className="btn-icon danger"
                  title="Excluir"
                >🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contratos do Serviço Selecionado */}
      {selectedService && (
        <div className="contracts-section">
          <div className="section-header">
            <h2>{selectedService.name === 'multa' ? 'Multas' : selectedService.name === 'processo' ? 'Processos' : 'Contratos'} - {selectedService.name}</h2>
            <button onClick={() => openContractModal()} className="btn-primary">+ Novo</button>
          </div>

          {loadingContracts ? (
            <div>Carregando...</div>
          ) : contracts.length === 0 ? (
            <div className="empty-state">Nenhum contrato. Adicione um novo!</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>{getTableHeaders().map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const name = selectedService.name?.toLowerCase();
                  return (
                    <tr key={contract.id}>
                      {name === 'multa' ? (
                        <>
                          <td>{contract.numero_multa || '-'}</td>
                          <td>{contract.vehicle_plate || '-'}</td>
                          <td>{contract.status || '-'}</td>
                        </>
                      ) : name === 'processo' ? (
                        <>
                          <td>{contract.process_number || '-'}</td>
                          <td>{contract.organ || '-'}</td>
                          <td>{contract.status || '-'}</td>
                        </>
                      ) : (
                        <td>{contract.status || '-'}</td>
                      )}
                      <td>{new Date(contract.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button 
                          onClick={() => openContractModal(contract)}
                          className="btn-icon"
                          title="Editar"
                        >✏️</button>
                        <button 
                          onClick={() => handleDeleteContract(contract.id)}
                          className="btn-icon danger"
                          title="Excluir"
                        >🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}


      {/* Modal Novo Serviço - Dropdown */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Serviço</h2>
              <button onClick={() => setShowServiceModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label>Tipo de Serviço *</label>
                <select
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowServiceModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={!selectedServiceType}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Contrato - Condicional */}
      {showContractModal && selectedService && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
<h2>{isEditing ? 'Editar' : 'Novo'} {selectedService.name === 'multa' ? 'Multa' : selectedService.name === 'processo' ? 'Processo' : 'Contrato'} - {selectedService.name}</h2>
              <button onClick={() => setShowContractModal(false)} className="btn-close">✏️</button>
            </div>
            <form onSubmit={handleSaveContract}>
              {(() => {
                const name = selectedService.name?.toLowerCase();
                if (name === 'multa') {
                  return (
                    <>
                      <div className="form-group">
                        <label>N da Multa *</label>
                        <input
                          value={contractForm.numero_multa}
                          onChange={(e) => setContractForm({...contractForm, numero_multa: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Placa</label>
                        <input
                          value={contractForm.vehicle_plate}
                          onChange={(e) => setContractForm({...contractForm, vehicle_plate: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Status *</label>
                        <select
                          value={contractForm.status}
                          onChange={(e) => setContractForm({...contractForm, status: e.target.value})}
                          required
                        >
                          <option value="">Selecione...</option>
                          {MULTA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  );
                } else if (name === 'processo') {
                  return (
                    <>
                      <div className="form-group">
                        <label>N do Processo *</label>
                        <input
                          value={contractForm.process_number}
                          onChange={(e) => setContractForm({...contractForm, process_number: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Tipo *</label>
                        <select
                          value={contractForm.organ}
                          onChange={(e) => setContractForm({...contractForm, organ: e.target.value})}
                          required
                        >
                          <option value="">Selecione...</option>
                          {PROCESSO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status *</label>
                        <input
                          value={contractForm.status}
                          onChange={(e) => setContractForm({...contractForm, status: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="form-group">
                      <label>Status *</label>
                      <input
                        value={contractForm.status}
                        onChange={(e) => setContractForm({...contractForm, status: e.target.value})}
                        required
                      />
                    </div>
                  );
                }
              })()}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowContractModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Atualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
