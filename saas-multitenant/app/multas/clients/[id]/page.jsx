'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientById } from '../../../lib/clientsAPI';
import { getServicesByClient, createService, deleteService } from '../../../lib/servicesAPI';
import { getContractsByService, createContract, updateContract, deleteContract } from '../../../lib/contractsAPI';

export default function ClientDetail({ params }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para modais
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  
  // Formulários
  const [serviceName, setServiceName] = useState('');
  const [contractForm, setContractForm] = useState({
    numero_multa: '',
    vehicle_plate: '',
    status: ''
  });

  const clientId = params?.id;

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientData = await getClientById(clientId);
      setClient(clientData);
      
      const servicesData = await getServicesByClient(clientId);
      setServices(servicesData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (serviceId) => {
    try {
      setLoadingContracts(true);
      const contractsData = await getContractsByService(serviceId);
      setContracts(contractsData);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await createService({
        client_id: clientId,
        name: serviceName
      });
      setShowServiceModal(false);
      setServiceName('');
      loadClientData();
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
      setError(err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await deleteService(serviceId);
        loadClientData();
      } catch (err) {
        console.error('Erro ao deletar serviço:', err);
      }
    }
  };

  const handleSelectService = async (service) => {
    setSelectedService(service);
    await loadContracts(service.id);
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await createContract({
        client_id: clientId,
        service_id: selectedService.id,
        organ: 'DETRAN', // valor padrão
        numero_multa: contractForm.numero_multa,
        vehicle_plate: contractForm.vehicle_plate,
        status: contractForm.status || 'Em andamento'
      });
      setShowContractModal(false);
      setContractForm({ numero_multa: '', vehicle_plate: '', status: '' });
      loadContracts(selectedService.id);
    } catch (err) {
      console.error('Erro ao criar contrato:', err);
      setError(err.message);
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (confirm('Tem certeza que deseja excluir esta multa?')) {
      try {
        await deleteContract(contractId);
        if (selectedService) {
          loadContracts(selectedService.id);
        }
      } catch (err) {
        console.error('Erro ao deletar contrato:', err);
      }
    }
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="error-message">
        <p>Cliente não encontrado</p>
        <button onClick={() => router.push('/multas/clients')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="client-detail">
      {/* Breadcrumb com botão Voltar */}
      <div className="breadcrumb">
        <button 
          onClick={() => router.push('/dashboard?module=multas&tab=dashboard')} 
          className="btn-back"
        >
          ← Voltar
        </button>
        <span className="separator">|</span>
        <span onClick={() => router.push('/dashboard?module=multas&tab=clients')}>Clientes</span>
        <span className="separator">/</span>
        <span className="current">{client.name}</span>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Dados do Cliente */}
      <div className="client-header">
        <div className="client-info">
          <h1>{client.name}</h1>
          <div className="client-details">
            <span><strong>CPF:</strong> {formatCPF(client.cpf)}</span>
            <span><strong>CNH:</strong> {client.cnh || '-'}</span>
            <span><strong>Telefone:</strong> {client.phone || '-'}</span>
            <span><strong>Email:</strong> {client.email || '-'}</span>
          </div>
        </div>
      </div>

      {/* Lista de Serviços */}
      <div className="services-section">
        <div className="section-header">
          <h2>Serviços</h2>
          <button 
            onClick={() => setShowServiceModal(true)} 
            className="btn-primary"
          >
            + Novo Serviço
          </button>
        </div>

        {services.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum serviço cadastrado</p>
            <p className="hint">Clique em "+ Novo Serviço" para adicionar</p>
          </div>
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
                  <span className="service-date">
                    Criado em: {new Date(service.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteService(service.id);
                  }}
                  className="btn-icon danger"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contratos do Serviço Selecionado */}
      {selectedService && (
        <div className="contracts-section">
          <div className="section-header">
            <h2>Multas - {selectedService.name}</h2>
            <button 
              onClick={() => setShowContractModal(true)} 
              className="btn-primary"
            >
              + Nova Multa
            </button>
          </div>

          {loadingContracts ? (
            <div className="loading-inline">Carregando...</div>
          ) : contracts.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma multa cadastrada</p>
              <p className="hint">Clique em "+ Nova Multa" para adicionar</p>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nº Multa</th>
                    <th>Placa</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.numero_multa || '-'}</td>
                      <td>{contract.vehicle_plate || '-'}</td>
                      <td>{contract.status || '-'}</td>
                      <td>{new Date(contract.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteContract(contract.id)}
                          className="btn-icon danger"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Serviço */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Serviço</h2>
              <button onClick={() => setShowServiceModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateService} className="modal-form">
              <div className="form-group">
                <label>Nome do Serviço *</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Defesa Multa Radar"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowServiceModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Multa */}
      {showContractModal && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Multa - {selectedService?.name}</h2>
              <button onClick={() => setShowContractModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateContract} className="modal-form">
              <div className="form-group">
                <label>Nº da Multa *</label>
                <input
                  type="text"
                  value={contractForm.numero_multa}
                  onChange={(e) => setContractForm({...contractForm, numero_multa: e.target.value})}
                  placeholder="Ex: 123456789"
                  required
                />
              </div>
              <div className="form-group">
                <label>Placa do Veículo</label>
                <input
                  type="text"
                  value={contractForm.vehicle_plate}
                  onChange={(e) => setContractForm({...contractForm, vehicle_plate: e.target.value})}
                  placeholder="Ex: ABC-1234"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <input
                  type="text"
                  value={contractForm.status}
                  onChange={(e) => setContractForm({...contractForm, status: e.target.value})}
                  placeholder="Ex: Em andamento"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowContractModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

