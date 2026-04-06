'use client';

import { useState, useEffect } from 'react';
import { getAllFineLogs, getFineLogs, FINE_STATUS_LABELS, FINE_STAGE_LABELS } from '../lib/finesAPI';

const ACTION_LABELS = {
  created: 'Criação',
  status_changed: 'Status alterado',
  stage_changed: 'Estágio alterado',
  document_added: 'Documento adicionado',
  updated: 'Atualização',
  deleted: 'Exclusão'
};

const ACTION_COLORS = {
  created: '#22c55e',
  status_changed: '#3b82f6',
  stage_changed: '#8b5cf6',
  document_added: '#f59e0b',
  updated: '#06b6d4',
  deleted: '#ef4444'
};

const ACTION_ICONS = {
  created: '✓',
  status_changed: '↔',
  stage_changed: '↑',
  document_added: '📄',
  updated: '✎',
  deleted: '✕'
};

const PAGE_SIZE = 20;

export default function MultasHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filtros
  const [filters, setFilters] = useState({ action: '', days: '30' });

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * PAGE_SIZE;
      const data = await getAllFineLogs(PAGE_SIZE, offset);
      if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      } else {
        setLogs(data?.data || data?.logs || []);
        setTotal(data?.total || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    loadLogs();
  };

  const clearFilters = () => {
    setFilters({ action: '', days: '30' });
    setPage(1);
    loadLogs();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(filters.days || 30));

  const filteredLogs = logs.filter(log => {
    const matchAction = !filters.action || log.action === filters.action;
    const matchDate = !log.created_at || new Date(log.created_at) >= cutoff;
    return matchAction && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const renderChangeDetail = (log) => {
    if (log.old_value && log.new_value) {
      const oldLabel = FINE_STATUS_LABELS[log.old_value] || FINE_STAGE_LABELS[log.old_value] || log.old_value;
      const newLabel = FINE_STATUS_LABELS[log.new_value] || FINE_STAGE_LABELS[log.new_value] || log.new_value;
      return (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {oldLabel} → <strong style={{ color: '#111' }}>{newLabel}</strong>
        </span>
      );
    }
    if (log.new_value) {
      return <span style={{ fontSize: 12, color: '#6b7280' }}>{log.new_value}</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="multas-history">

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Ação</label>
          <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Período</label>
          <select value={filters.days} onChange={(e) => setFilters({ ...filters, days: e.target.value })}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
        <button onClick={applyFilters} className="btn-filter">Filtrar</button>
        <button onClick={clearFilters} className="btn-reset">Limpar</button>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Resumo */}
      <div style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
        {filteredLogs.length} atividade{filteredLogs.length !== 1 ? 's' : ''} encontrada{filteredLogs.length !== 1 ? 's' : ''}
      </div>

      {/* Lista de atividades */}
      <div className="activity-list">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma atividade registrada no período</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="activity-card">
              <div
                className="activity-icon"
                style={{
                  backgroundColor: `${ACTION_COLORS[log.action] || '#6b7280'}20`,
                  color: ACTION_COLORS[log.action] || '#6b7280',
                  minWidth: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16
                }}
              >
                {ACTION_ICONS[log.action] || '·'}
              </div>
              <div className="activity-content" style={{ flex: 1 }}>
                <div className="activity-header" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: ACTION_COLORS[log.action] || '#111' }}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  {log.field_name && log.field_name !== 'fine' && (
                    <span style={{ fontSize: 12, color: '#6b7280' }}>• {log.field_name}</span>
                  )}
                </div>
                <div style={{ marginTop: 2 }}>
                  {renderChangeDetail(log)}
                </div>
                <div className="activity-meta" style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
                  <span>👤 {log.user_name || log.user_email || 'Sistema'}</span>
                  <span>🕐 {formatDate(log.created_at)}</span>
                  {log.fine_id && (
                    <span style={{ fontFamily: 'monospace' }}>#{log.fine_id.substring(0, 8)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 24, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-pagination">
            ← Anterior
          </button>
          <span className="page-info">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-pagination">
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
