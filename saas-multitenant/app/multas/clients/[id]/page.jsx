 'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientById } from '../../../lib/clientsAPI';
import { getFines, createFine, updateFine, deleteFine } from '../../../lib/finesAPI';

const toInputDate = (value) => {
  if (!value) return '';
  return value.substring(0, 10);
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const STATUS_LABELS = {
  pendente: 'Pendente',
  aguardando_documento: 'Aguard. Documento',
  protocolado: 'Protocolado',
  deferido: 'Deferido',
  indeferido: 'Indeferido',
  cancelado: 'Cancelado',
};

const STATUS_COLORS = {
  pendente: '#f59e0b',
  aguardando_documento: '#3b82f6',
  protocolado: '#8b5cf6',
  deferido: '#10b981',
  indeferido: '#ef4444',
  cancelado: '#6b7280',
};

const STAGE_LABELS = {
  cadastro: 'Cadastro',
  defesa_previa: 'Defesa PrÃ©via',
  recurso_1: 'Recurso 1Âª',
  recurso_2: 'Recurso 2Âª',
  finalizado: 'Finalizado',
};

const EMPTY_FINE = {
  fine_number: '', plate: '', organ: '', infraction_type: '',
  vehicle_model: '', infraction_date: '', due_date: '', defense_date: '',
  stage: 'cadastro', status: 'pendente', value: '', cost: '', paid_value: '',
  seller_id: '', notes: '',
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [client, setClient] = useState(null);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingFine, setEditingFine] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FINE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientData, finesData] = await Promise.all([
        getClientById(id),
        getFines({ client_id: id }),
      ]);
      setClient(clientData);
      setFines(Array.isArray(finesData) ? finesData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, client_id: id };
      if (editingFine) {
        await updateFine(editingFine.id, payload);
      } else {
        await createFine(payload);
      }
      setShowModal(false);
      setEditingFine(null);
      setFormData(EMPTY_FINE);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fine) => {
    setEditingFine(fine);
    setFormData({
      fine_number:     fine.fine_number     || '',
      plate:           fine.plate           || '',
      organ:           fine.organ           || '',
      infraction_type: fine.infraction_type || '',
      vehicle_model:   fine.vehicle_model   || '',
      infraction_date: toInputDate(fine.infraction_date),
      due_date:        toInputDate(fine.due_date),
      defense_date:    toInputDate(fine.defense_date),
      stage:           fine.stage           || 'cadastro',
      status:          fine.status          || 'pendente',
      value:           fine.value           || '',
      cost:            fine.cost            || '',
      paid_value:      fine.paid_value      || '',
      seller_id:       fine.seller_id       || '',
      notes:           fine.notes           || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (fineId) => {
    if (!confirm('Deseja excluir esta multa?')) return;
    try {
      await deleteFine(fineId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openNewFineModal = () => {
    setEditingFine(null);
    setFormData(EMPTY_FINE);
    setShowModal(true);
  };

  const Field = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{value || '-'}</span>
    </div>
  );

  const Input = ({ label, ...props }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</label>
      <input
        style={{
          border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px',
          fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
          background: '#fff', color: '#111827',
        }}
        {...props}
      />
    </div>
  );

  const Select = ({ label, children, ...props }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</label>
      <select
        style={{
          border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px',
          fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
          background: '#fff', color: '#111827',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );

  const set = (field) => (e) => setFormData((f) => ({ ...f, [field]: e.target.value }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</span>
    </div>
  );

  if (!client) return (
    <div style={{ padding: 32, color: '#ef4444' }}>Cliente nÃ£o encontrado.</div>
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14, color: '#6b7280' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 14, padding: 0 }}
        >
          â† Voltar
        </button>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 500 }}>{client.name}</span>
      </div>

      {/* Header do cliente */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>{client.name}</h1>

      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '20px 24px', marginBottom: 28,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20,
      }}>
        <Field label="Data de Nasc." value={formatDate(client.birth_date)} />
        <Field label="CPF" value={client.cpf} />
        <Field label="CNH" value={client.cnh} />
        <Field label="1Âª CNH" value={formatDate(client.first_cnh)} />
        <Field label="Telefone" value={client.phone} />
        <Field label="E-mail" value={client.email} />
      </div>

      {/* Erros */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: 16, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', color: '#ef4444', fontSize: 14,
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18, lineHeight: 1 }}>Ã—</button>
        </div>
      )}

      {/* SeÃ§Ã£o de Multas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111827', margin: 0 }}>Contratacoes</h2>
        <button
          onClick={openNewFineModal}
          style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          + Novo Servico
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {fines.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            Nenhum servico contratado ainda.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Multa', 'Placa', 'Ã“rgÃ£o', 'Vencimento', 'EstÃ¡gio', 'Status', 'Valor', 'AÃ§Ãµes'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fines.map((fine, i) => (
                <tr key={fine.id} style={{ borderBottom: i < fines.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{fine.fine_number || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>{fine.plate || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>{fine.organ || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>{formatDate(fine.due_date)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, color: '#4b5563', background: '#f3f4f6', borderRadius: 4, padding: '2px 8px' }}>
                      {STAGE_LABELS[fine.stage] || fine.stage || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500, borderRadius: 4, padding: '2px 8px',
                      color: '#fff', background: STATUS_COLORS[fine.status] || '#6b7280',
                    }}>
                      {STATUS_LABELS[fine.status] || fine.status || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{formatCurrency(fine.value)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleEdit(fine)}
                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#1d4ed8' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(fine.id)}
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#b91c1c' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620,
              maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{editingFine ? 'Editar Multa' : 'Nova Multa'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>Ã—</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Input label="NÃºmero da Multa" value={formData.fine_number} onChange={set('fine_number')} />
                <Input label="Placa" value={formData.plate} onChange={set('plate')} />
                <Input label="Ã“rgÃ£o *" value={formData.organ} onChange={set('organ')} required />
                <Input label="Tipo de InfraÃ§Ã£o" value={formData.infraction_type} onChange={set('infraction_type')} />
                <Input label="Modelo do VeÃ­culo" value={formData.vehicle_model} onChange={set('vehicle_model')} />
                <Input label="Data da InfraÃ§Ã£o" type="date" value={formData.infraction_date} onChange={set('infraction_date')} />
                <Input label="Vencimento" type="date" value={formData.due_date} onChange={set('due_date')} />
                <Input label="Prazo de Defesa" type="date" value={formData.defense_date} onChange={set('defense_date')} />
                <Select label="EstÃ¡gio" value={formData.stage} onChange={set('stage')}>
                  <option value="cadastro">Cadastro</option>
                  <option value="defesa_previa">Defesa PrÃ©via</option>
                  <option value="recurso_1">Recurso 1Âª InstÃ¢ncia</option>
                  <option value="recurso_2">Recurso 2Âª InstÃ¢ncia</option>
                  <option value="finalizado">Finalizado</option>
                </Select>
                <Select label="Status" value={formData.status} onChange={set('status')}>
                  <option value="pendente">Pendente</option>
                  <option value="aguardando_documento">Aguardando Documento</option>
                  <option value="protocolado">Protocolado</option>
                  <option value="deferido">Deferido</option>
                  <option value="indeferido">Indeferido</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
                <Input label="Valor (R$)" type="number" step="0.01" value={formData.value} onChange={set('value')} />
                <Input label="Custo (R$)" type="number" step="0.01" value={formData.cost} onChange={set('cost')} />
                <Input label="Valor Pago (R$)" type="number" step="0.01" value={formData.paid_value} onChange={set('paid_value')} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 4 }}>ObservaÃ§Ãµes</label>
                <textarea
                  value={formData.notes}
                  onChange={set('notes')}
                  rows={3}
                  style={{
                    border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px',
                    fontSize: 14, width: '100%', boxSizing: 'border-box',
                    resize: 'vertical', fontFamily: 'inherit', color: '#111827',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 18px', background: saving ? '#93c5fd' : '#3b82f6',
                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                    fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Salvando...' : (editingFine ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
