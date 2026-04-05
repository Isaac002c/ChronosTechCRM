'use client';

import { useState, useEffect } from 'react';
import {
  getFines,
  createFine,
  updateFine,
  deleteFine,
  updateFineStatus,
  updateFineStage,
  FINE_STATUS_LABELS,
  FINE_STAGE_LABELS
} from '../lib/finesAPI';
import { getClients } from '../lib/clientsAPI';

const ORGANS = ['DETRAN', 'DER', 'PRF', 'CET', 'DETRAN-SP', 'OUTROS'];

const emptyForm = {
  client_id: '',
  organ: '',
  fine_number: '',
  plate: '',
  infraction_type: '',
  vehicle_model: '',
  infraction_date: '',
  due_date: '',
  defense_date: '',
  stage: 'cadastro',
  status: 'pendente',
  value: '',
  cost: '',
  notes: ''
};

export default function MultasContracts() {
  const [fines, setFines] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFine, setEditingFine] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({ status: '', organ: '', plate: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      // Limpar filtros vazios antes de enviar
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== '')
      );
      const [finesData, clientsData] = await Promise.all([
        getFines(cleanFilters),
        getClients()
      ]);
      setFines(finesData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Erro ao carregar multas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => loadData(filters);

  const clearFilters = () => {
    const empty = { status: '', organ: '', plate: '' };
    setFilters(empty);
    loadData(empty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        client_id: formData.client_id,
        organ: formData.organ,
        fine_number: formData.fine_number || null,
        plate: formData.plate || null,
        infraction_type: formData.infraction_type || null,
        vehicle_model: formData.vehicle_model || null,
        infraction_date: formData.infraction_date || null,
        due_date: formData.due_date || null,
        defense_date: formData.defense_date || null,
        stage: formData.stage || 'cadastro',
        status: formData.status || 'pendente',
        value: formData.value ? parseFloat(formData.value) : 0,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || null
      };

      if (editingFine) {
        await updateFine(editingFine.id, payload);
      } else {
        await createFine(payload);
      }
      setShowModal(false);
      setEditingFine(null);
      setFormData(emptyForm);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar multa:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fine) => {
    setEditingFine(fine);
    setFormData({
      client_id: fine.client_id || '',
      organ: fine.organ || '',
      fine_number: fine.fine_number || '',
      plate: fine.plate || '',
      infraction_type: fine.infraction_type || '',
      vehicle_model: fine.vehicle_model || '',
      infraction_date: fine.infraction_date ? fine.infraction_date.substring(0, 10) : '',
      due_date: fine.due_date ? fine.due_date.substring(0, 10) : '',
      defense_date: fine.defense_date ? fine.defense_date.substring(0, 10) : '',
      stage: fine.stage || 'cadastro',
      status: fine.status || 'pendente',
      value: fine.value || '',
      cost: fine.cost || '',
      notes: fine.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta multa?')) return;
    try {
      await deleteFine(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateFineStatus(id, newStatus);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStageChange = async (id, newStage) => {
    try {
      await updateFineStage(id, newStage);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const openNew = () => {
    setEditingFine(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando multas...</p>
      </div>
    );
  }

  return (
    <div className="multas-contracts">

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(FINE_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Ã“rgÃ£o</label>
          <select value={filters.organ} onChange={(e) => setFilters({ ...filters, organ: e.target.value })}>
            <option value="">Todos</option>
            {ORGANS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Placa</label>
          <input
            type="text"
            placeholder="Buscar por placa..."
            value={filters.plate}
            onChange={(e) => setFilters({ ...filters, plate: e.target.value.toUpperCase() })}
          />
        </div>
        <button onClick={applyFilters} className="btn-filter">Filtrar</button>
        <button onClick={clearFilters} className="btn-reset">Limpar</button>
        <button onClick={openNew} className="btn-primary">+ Nova Multa</button>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>âœ•</button>
        </div>
      )}

      {/* Tabela */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NÂº Multa</th>
              <th>Cliente</th>
              <th>Ã“rgÃ£o</th>
              <th>Placa</th>
              <th>Valor</th>
              <th>EstÃ¡gio</th>
              <th>Status</th>
              <th>Vencimento</th>
              <th>AÃ§Ãµes</th>
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">Nenhuma multa encontrada</td>
              </tr>
            ) : (
              fines.map((fine) => (
                <tr key={fine.id}>
                  <td>{fine.fine_number || '-'}</td>
                  <td>{fine.client_name || '-'}</td>
                  <td>{fine.organ}</td>
                  <td>{fine.plate || '-'}</td>
                  <td>{formatCurrency(fine.value)}</td>
                  <td>
                    <select
                      value={fine.stage}
                      onChange={(e) => handleStageChange(fine.id, e.target.value)}
                      className="status-select"
                    >
                      {Object.entries(FINE_STAGE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={fine.status}
                      onChange={(e) => handleStatusChange(fine.id, e.target.value)}
                      className="status-select"
                    >
                      {Object.entries(FINE_STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(fine.due_date)}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEdit(fine)} className="btn-icon" title="Editar">âœï¸</button>
                    <button onClick={() => handleDelete(fine.id)} className="btn-icon danger" title="Excluir">ðŸ—‘ï¸</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFine ? 'Editar Multa' : 'Nova Multa'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">[X]</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ã“rgÃ£o *</label>
                  <select
                    value={formData.organ}
                    onChange={(e) => setFormData({ ...formData, organ: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    {ORGANS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>NÂº da Multa</label>
                  <input type="text" value={formData.fine_number}
                    onChange={(e) => setFormData({ ...formData, fine_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Placa</label>
                  <input type="text" value={formData.plate} maxLength={7} placeholder="ABC1234"
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de InfraÃ§Ã£o</label>
                  <input type="text" value={formData.infraction_type}
                    onChange={(e) => setFormData({ ...formData, infraction_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Modelo do VeÃ­culo</label>
                  <input type="text" value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data da InfraÃ§Ã£o</label>
                  <input type="date" value={formData.infraction_date}
                    onChange={(e) => setFormData({ ...formData, infraction_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Vencimento</label>
                  <input type="date" value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Prazo de Defesa</label>
                  <input type="date" value={formData.defense_date}
                    onChange={(e) => setFormData({ ...formData, defense_date: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>EstÃ¡gio</label>
                  <select value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                    {Object.entries(FINE_STAGE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {Object.entries(FINE_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" placeholder="0,00" value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Custo do ServiÃ§o (R$)</label>
                  <input type="number" step="0.01" placeholder="0,00" value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>ObservaÃ§Ãµes</label>
                <textarea rows={3} value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingFine ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
