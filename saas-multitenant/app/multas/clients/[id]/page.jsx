'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClientById } from '../../../lib/clientsAPI';
import { getServicesByClient, createService, deleteService } from '../../../lib/servicesAPI';
import { getContractsByService, createContract, updateContract, deleteContract } from '../../../lib/contractsAPI';

const SERVICE_TYPES = ['CRCI', 'MULTA', 'SUSPENSAO', 'CASSACAO', 'REVISAO DE ATOS', 'PROCESSO'];
const MULTA_STATUSES = [
  'APRS DEFESA PREVIA',
  'DEFESA PREVIA - ANALISE',
  'APRS 1 INSTANCIA',
  '1 INSTANCIA - ANALISE',
  'APRS 2 INSTANCIA',
  '2 INSTANCIA - ANALISE'
];
const PROCESSO_TIPOS = ['DETRAN', 'DER', 'DNIT', 'SMTR', 'RENAINF', 'PMRJ', 'PREFEITURA UF'];

const STATUS_COLORS = {
  'APRS DEFESA PREVIA':      '#6366f1',
  'DEFESA PREVIA - ANALISE': '#8b5cf6',
  'APRS 1 INSTANCIA':        '#f59e0b',
  '1 INSTANCIA - ANALISE':   '#f97316',
  'APRS 2 INSTANCIA':        '#ef4444',
  '2 INSTANCIA - ANALISE':   '#dc2626',
};

export default function ClientDetail() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id;

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [contractsMap, setContractsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [contractForm, setContractForm] = useState({
    numero_multa: '', vehicle_plate: '', process_number: '', organ: '', status: ''
  });

  useEffect(() => { if (clientId) loadAll(); }, [clientId]);

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
      const entries = await Promise.all(
        (servicesData || []).map(async (s) => {
          try { return [s.id, await getContractsByService(s.id) || []]; }
          catch { return [s.id, []]; }
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
    } catch (err) { setError(err.message); }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Excluir este servico e todos os seus contratos?')) return;
    try { await deleteService(serviceId); loadAll(); }
    catch (err) { setError(err.message); }
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
      if (!contractForm.numero_multa || !contractForm.status) { setError('Preencha N da Multa e Status'); return; }
      payload = { ...payload, numero_multa: contractForm.numero_multa, vehicle_plate: contractForm.vehicle_plate, status: contractForm.status, organ: contractForm.organ || 'DETRAN' };
    } else if (name === 'processo') {
      if (!contractForm.process_number || !contractForm.organ || !contractForm.status) { setError('Preencha N do Processo, Tipo e Status'); return; }
      payload = { ...payload, process_number: contractForm.process_number, organ: contractForm.organ, status: contractForm.status };
    } else {
      if (!contractForm.status) { setError('Preencha o Status'); return; }
      payload = { ...payload, status: contractForm.status };
    }
    try {
      if (editingContract) { await updateContract(editingContract.id, payload); }
      else { await createContract(payload); }
      setShowContractModal(false);
      const updated = await getContractsByService(selectedService.id);
      setContractsMap(prev => ({ ...prev, [selectedService.id]: updated || [] }));
    } catch (err) { setError(err.message); }
  };

  const handleDeleteContract = async (serviceId, contractId) => {
    if (!confirm('Excluir este contrato?')) return;
    try {
      await deleteContract(contractId);
      const updated = await getContractsByService(serviceId);
      setContractsMap(prev => ({ ...prev, [serviceId]: updated || [] }));
    } catch (err) { setError(err.message); }
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
    <div className="error-container">
      <p>Cliente nao encontrado</p>
      <button onClick={() => router.back()} className="btn-retry">Voltar</button>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
          &larr; Voltar
        </button>
        <span className="separator">/</span>
        <span className="current">{client.name}</span>
      </div>

      {error && (
        <div className="error-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button onClick={() => setError(null)} className="btn-close">x</button>
        </div>
      )}

      {/* Dados Pessoais */}
      <div className="client-header">
        <div className="client-info">
          <h1>{client.name}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
            {[
              { label: 'Data de Nasc.', value: formatDate(client.birth_date) },
              { label: 'CPF', value: formatCPF(client.cpf) },
              { label: 'CNH', value: client.cnh || '-' },
              { label: '1a CNH', value: formatDate(client.first_cnh) },
              { label: 'Telefone', value: client.phone || '-' },
              { label: 'E-mail', value: client.email || '-' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{value}</span>
              </div>
            ))}
            {client.address && (
              <div style={{ gridColumn: '1/-1' }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Endereco</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{client.address}</span>
              </div>
            )}
            {client.notes && (
              <div style={{ gridColumn: '1/-1' }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Observacoes</span>
                <span style={{ fontSize: 14, color: '#475569' }}>{client.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contratacoes */}
      <div className="contracts-section">
        <div className="section-header">
          <h3 style={{ margin: 0 }}>Contratacoes</h3>
          <button onClick={() => setShowServiceModal(true)} className="btn-primary">+ Novo Servico</button>
        </div>

        {services.length === 0 ? (
          <div className="no-data">Nenhum servico contratado ainda.</div>
        ) : (
          services.map((service) => {
            const contracts = contractsMap[service.id] || [];
            const name = service.name?.toLowerCase();
            return (
              <div key={service.id} style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{service.name}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{contracts.length} contrato{contracts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openContractModal(service)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>+ Adicionar</button>
                    <button onClick={() => handleDeleteService(service.id)} className="btn-secondary btn-danger" style={{ padding: '6px 14px', fontSize: 13 }}>Excluir</button>
                  </div>
                </div>

                {contracts.length === 0 ? (
                  <div style={{ padding: 16, color: '#94a3b8', fontSize: 14 }}>Nenhum contrato neste servico.</div>
                ) : (
                  <table className="data-table" style={{ borderRadius: 0, border: 'none' }}>
                    <thead>
                      <tr>
                        {name === 'multa' && <><th>N Multa</th><th>Placa</th></>}
                        {name === 'processo' && <><th>N Processo</th><th>Tipo</th></>}
                        {name !== 'multa' && name !== 'processo' && <th>Servico</th>}
                        <th>Andamento</th>
                        <th>Data</th>
                        <th>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <tr key={contract.id}>
                          {name === 'multa' && <><td>{contract.numero_multa || '-'}</td><td>{contract.vehicle_plate || '-'}</td></>}
                          {name === 'processo' && <><td>{contract.process_number || '-'}</td><td>{contract.organ || '-'}</td></>}
                          {name !== 'multa' && name !== 'processo' && <td>{service.name}</td>}
                          <td>
                            <span className="status-badge" style={{
                              background: STATUS_COLORS[contract.status] ? `${STATUS_COLORS[contract.status]}20` : '#f1f5f9',
                              color: STATUS_COLORS[contract.status] || '#475569',
                              fontSize: 11
                            }}>
                              {contract.status || '-'}
                            </span>
                          </td>
                          <td>{formatDate(contract.created_at)}</td>
                          <td>
                            <div className="actions-cell">
                              <button onClick={() => openContractModal(service, contract)} className="btn-icon" title="Editar">&#9999;</button>
                              <button onClick={() => handleDeleteContract(service.id, contract.id)} className="btn-icon danger" title="Excluir">&#128465;</button>
                            </div>
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

      {/* Modal Novo Servico */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Servico</h2>
              <button onClick={() => setShowServiceModal(false)} className="btn-close">x</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateService}>
                <div className="form-group">
                  <label>Tipo de Servico *</label>
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
        </div>
      )}

      {/* Modal Contrato */}
      {showContractModal && selectedService && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContract ? 'Editar' : 'Novo'} - {selectedService.name}</h2>
              <button onClick={() => setShowContractModal(false)} className="btn-close">x</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveContract}>
                {(() => {
                  const name = selectedService.name?.toLowerCase();
                  if (name === 'multa') return (
                    <>
                      <div className="form-group"><label>N da Multa *</label><input value={contractForm.numero_multa} onChange={e => setContractForm({...contractForm, numero_multa: e.target.value})} required /></div>
                      <div className="form-group"><label>Placa</label><input value={contractForm.vehicle_plate} onChange={e => setContractForm({...contractForm, vehicle_plate: e.target.value})} /></div>
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
                      <div className="form-group"><label>N do Processo *</label><input value={contractForm.process_number} onChange={e => setContractForm({...contractForm, process_number: e.target.value})} required /></div>
                      <div className="form-group">
                        <label>Tipo *</label>
                        <select value={contractForm.organ} onChange={e => setContractForm({...contractForm, organ: e.target.value})} required>
                          <option value="">Selecione...</option>
                          {PROCESSO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group"><label>Andamento *</label><input value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} required /></div>
                    </>
                  );
                  return <div className="form-group"><label>Andamento *</label><input value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} required /></div>;
                })()}
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowContractModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">{editingContract ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
