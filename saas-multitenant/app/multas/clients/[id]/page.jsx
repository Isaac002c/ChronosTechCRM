'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClientById } from '../../../lib/clientsAPI';
import { getServicesByClient, createService, deleteService } from '../../../lib/servicesAPI';
import { getContractsByService, createContract, updateContract, deleteContract } from '../../../lib/contractsAPI';

const SERVICE_TYPES = ['CRCI', 'MULTA', 'SUSPENSÃƒO', 'CASSAÃ‡ÃƒO', 'REVISÃƒO DE ATOS', 'PROCESSO'];
const MULTA_STATUSES = [
  'APRS DEFESA PRÃ‰VIA',
  'DEFESA PRÃ‰VIA - ANÃLISE',
  'APRS 1 INSTÃ‚NCIA',
  '1 INSTÃ‚NCIA - ANÃLISE',
  'APRS 2 INSTÃ‚NCIA',
  '2 INSTÃ‚NCIA - ANÃLISE'
];
const PROCESSO_TIPOS = ['DETRAN', 'DER', 'DNIT', 'SMTR', 'RENAINF', 'PMRJ', 'PREFEITURA UF'];

export default function ClientDetail() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id;

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [contractsMap, setContractsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modais
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [contractForm, setContractForm] = useState({
    numero_multa: '', vehicle_plate: '', process_number: '', organ: '', status: ''
  });

  useEffect(() => {
    if (clientId) loadAll();
  }, [clientId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientData, servicesData] = await Promise.all([
        getClientById(clientId),
        getServicesByClient(clientId)
      ]);
      setClient(clientData);
      setServices(servicesData || []);

      // Carrega contratos de todos os serviÃ§os de uma vez
      const entries = await Promise.all(
        (servicesData || []).map(async (s) => {
          try {
            const contracts = await getContractsByService(s.id);
            return [s.id, contracts || []];
          } catch {
            return [s.id, []];
          }
        })
      );
      setContractsMap(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message || 'Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!selectedServiceType) return;
    try {
      await createService({ client_id: clientId, name: selectedServiceType });
      setShowServiceModal(false);
      setSelectedServiceType('');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Excluir este serviÃ§o e todos os seus contratos?')) return;
    try {
      await deleteService(serviceId);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const openContractModal = (service, contract = null) => {
    setSelectedService(service);
    setEditingContract(contract);
    setContractForm(contract ? {
      numero_multa: contract.numero_multa || '',
      vehicle_plate: contract.vehicle_plate || '',
      process_number: contract.process_number || '',
      organ: contract.organ || '',
      status: contract.status || ''
    } : { numero_multa: '', vehicle_plate: '', process_number: '', organ: '', status: '' });
    setShowContractModal(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    const name = selectedService.name?.toLowerCase() || '';
    let payload = { service_id: selectedService.id, client_id: clientId };

    if (name === 'multa') {
      if (!contractForm.numero_multa || !contractForm.status) { setError('Preencha NÂº da Multa e Status'); return; }
      payload = { ...payload, numero_multa: contractForm.numero_multa, vehicle_plate: contractForm.vehicle_plate, status: contractForm.status, organ: contractForm.organ || 'DETRAN' };
    } else if (name === 'processo') {
      if (!contractForm.process_number || !contractForm.organ || !contractForm.status) { setError('Preencha NÂº do Processo, Tipo e Status'); return; }
      payload = { ...payload, process_number: contractForm.process_number, organ: contractForm.organ, status: contractForm.status };
    } else {
      if (!contractForm.status) { setError('Preencha o Status'); return; }
      payload = { ...payload, status: contractForm.status };
    }

    try {
      if (editingContract) {
        await updateContract(editingContract.id, payload);
      } else {
        await createContract(payload);
      }
      setShowContractModal(false);
      // Recarrega contratos sÃ³ do serviÃ§o alterado
      const updated = await getContractsByService(selectedService.id);
      setContractsMap(prev => ({ ...prev, [selectedService.id]: updated || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteContract = async (serviceId, contractId) => {
    if (!confirm('Excluir este contrato?')) return;
    try {
      await deleteContract(contractId);
      const updated = await getContractsByService(serviceId);
      setContractsMap(prev => ({ ...prev, [serviceId]: updated || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCPF = (cpf) => cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4') : '-';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Carregando cliente...</p>
    </div>
  );

  if (!client) return (
    <div className="error-message">
      <p>Cliente nÃ£o encontrado</p>
      <button onClick={() => router.back()}>â† Voltar</button>
    </div>
  );

  return (
    <div className="client-detail">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => router.back()} className="btn-back">â† Voltar</button>
        <span>/ {client.name}</span>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>âœ•</button>
        </div>
      )}

      {/* â”€â”€ DADOS PESSOAIS â”€â”€ */}
      <div className="client-card">
        <h2 className="client-name">{client.name}</h2>
        <div className="client-info-grid">
          <div className="info-item">
            <span className="info-label">Data de Nasc.</span>
            <span className="info-value">{formatDate(client.birth_date)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">CPF</span>
            <span className="info-value">{formatCPF(client.cpf)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">CNH</span>
            <span className="info-value">{client.cnh || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">1Âª CNH</span>
            <span className="info-value">{formatDate(client.first_cnh)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Telefone</span>
            <span className="info-value">{client.phone || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">E-mail</span>
            <span className="info-value">{client.email || '-'}</span>
          </div>
          {client.address && (
            <div className="info-item full-width">
              <span className="info-label">EndereÃ§o</span>
              <span className="info-value">{client.address}</span>
            </div>
          )}
          {client.notes && (
            <div className="info-item full-width">
              <span className="info-label">ObservaÃ§Ãµes</span>
              <span className="info-value">{client.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ CONTRATAÃ‡Ã•ES â”€â”€ */}
      <div className="contratacoes-section">
        <div className="section-header">
          <h2>ContrataÃ§Ãµes</h2>
          <button onClick={() => setShowServiceModal(true)} className="btn-primary">+ Novo ServiÃ§o</button>
        </div>

        {services.length === 0 ? (
          <div className="empty-state">Nenhum serviÃ§o contratado ainda.</div>
        ) : (
          services.map((service) => {
            const contracts = contractsMap[service.id] || [];
            const name = service.name?.toLowerCase();
            return (
              <div key={service.id} className="service-block">
                {/* CabeÃ§alho do serviÃ§o */}
                <div className="service-block-header">
                  <div className="service-block-title">
                    <span className="service-tag">{service.name}</span>
                    <span className="service-count">{contracts.length} contrato{contracts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="service-block-actions">
                    <button onClick={() => openContractModal(service)} className="btn-sm btn-primary">+ Adicionar</button>
                    <button onClick={() => handleDeleteService(service.id)} className="btn-sm btn-danger">Excluir serviÃ§o</button>
                  </div>
                </div>

                {/* Tabela de contratos */}
                {contracts.length === 0 ? (
                  <div className="empty-contracts">Nenhum contrato neste serviÃ§o.</div>
                ) : (
                  <table className="data-table contracts-table">
                    <thead>
                      <tr>
                        {name === 'multa' && <><th>NÂº Multa</th><th>Placa</th></>}
                        {name === 'processo' && <><th>NÂº Processo</th><th>Tipo</th></>}
                        {name !== 'multa' && name !== 'processo' && <th>ServiÃ§o</th>}
                        <th>Andamento</th>
                        <th>Data</th>
                        <th>AÃ§Ãµes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <tr key={contract.id}>
                          {name === 'multa' && (
                            <><td>{contract.numero_multa || '-'}</td><td>{contract.vehicle_plate || '-'}</td></>
                          )}
                          {name === 'processo' && (
                            <><td>{contract.process_number || '-'}</td><td>{contract.organ || '-'}</td></>
                          )}
                          {name !== 'multa' && name !== 'processo' && (
                            <td>{service.name}</td>
                          )}
                          <td>
                            <span className="status-badge">{contract.status || '-'}</span>
                          </td>
                          <td>{formatDate(contract.created_at)}</td>
                          <td>
                            <button onClick={() => openContractModal(service, contract)} className="btn-icon" title="Editar">âœï¸</button>
                            <button onClick={() => handleDeleteContract(service.id, contract.id)} className="btn-icon danger" title="Excluir">ðŸ—‘ï¸</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* â”€â”€ MODAL NOVO SERVIÃ‡O â”€â”€ */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo ServiÃ§o</h2>
              <button onClick={() => setShowServiceModal(false)} className="btn-close">âœ•</button>
            </div>
            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label>Tipo de ServiÃ§o *</label>
                <select value={selectedServiceType} onChange={(e) => setSelectedServiceType(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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

      {/* â”€â”€ MODAL CONTRATO â”€â”€ */}
      {showContractModal && selectedService && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContract ? 'Editar' : 'Novo'} â€” {selectedService.name}</h2>
              <button onClick={() => setShowContractModal(false)} className="btn-close">âœ•</button>
            </div>
            <form onSubmit={handleSaveContract}>
              {(() => {
                const name = selectedService.name?.toLowerCase();
                if (name === 'multa') return (
                  <>
                    <div className="form-group">
                      <label>NÂº da Multa *</label>
                      <input value={contractForm.numero_multa} onChange={e => setContractForm({...contractForm, numero_multa: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Placa</label>
                      <input value={contractForm.vehicle_plate} onChange={e => setContractForm({...contractForm, vehicle_plate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Andamento *</label>
                      <select value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} required>
                        <option value="">Selecione...</option>
                        {MULTA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </>
                );
                if (name === 'processo') return (
                  <>
                    <div className="form-group">
                      <label>NÂº do Processo *</label>
                      <input value={contractForm.process_number} onChange={e => setContractForm({...contractForm, process_number: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Tipo *</label>
                      <select value={contractForm.organ} onChange={e => setContractForm({...contractForm, organ: e.target.value})} required>
                        <option value="">Selecione...</option>
                        {PROCESSO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Andamento *</label>
                      <input value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} required />
                    </div>
                  </>
                );
                return (
                  <div className="form-group">
                    <label>Andamento *</label>
                    <input value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} required />
                  </div>
                );
              })()}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowContractModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingContract ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
