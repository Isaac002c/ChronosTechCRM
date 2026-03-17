'use client';

import { useState, useEffect } from 'react';
import { getActivityLogs, getActivityStats, getEntityActivity } from '../lib/saasAPI';

export default function MultasHistory() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    date_range: '30'
  });
  
  // Modal de detalhes
  const [selectedLog, setSelectedLog] = useState(null);
  const [entityLogs, setEntityLogs] = useState([]);
  const [loadingEntityLogs, setLoadingEntityLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const logFilters = {
        page,
        limit: 20,
        entity_type: filters.entity_type,
        action: filters.action,
        days: parseInt(filters.date_range)
      };
      const [logsData, statsData] = await Promise.all([
        getActivityLogs(logFilters),
        getActivityStats(parseInt(filters.date_range))
      ]);
      setLogs(logsData.logs || []);
      setTotalPages(logsData.totalPages || 1);
      setStats(statsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntityLogs = async (log) => {
    if (!log.entity_type || !log.entity_id) return;
    
    setSelectedLog(log);
    setLoadingEntityLogs(true);
    try {
      const data = await getEntityActivity(log.entity_type, log.entity_id);
      setEntityLogs(data || []);
    } catch (err) {
      console.error('Erro ao buscar logs da entidade:', err);
      setEntityLogs([]);
    } finally {
      setLoadingEntityLogs(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'create': '[+]',
      'update': '[>]',
      'delete': '[-]',
      'login': '[L]',
      'logout': '[X]',
      'read': '[v]',
      'upload': '[U]',
      'download': '[D]',
      'update_password': '[P]'
    };
    return iconMap[action] || '[-]';
  };

  const getActionLabel = (action) => {
    const labels = {
      'create': 'Criação',
      'update': 'Atualização',
      'delete': 'Exclusão',
      'login': 'Login',
      'logout': 'Logout',
      'read': 'Visualização',
      'upload': 'Upload',
      'download': 'Download',
      'update_password': 'Senha alterada'
    };
    return labels[action] || action;
  };

  const getEntityLabel = (type) => {
    const labels = {
      'contract': 'Contrato',
      'client': 'Cliente',
      'document': 'Documento',
      'user': 'Usuário',
      'company': 'Empresa'
    };
    return labels[type] || type;
  };

  const getActionColor = (action) => {
    const colors = {
      'create': '#22c55e',
      'update': '#3b82f6',
      'delete': '#ef4444',
      'login': '#8b5cf6',
      'logout': '#6b7280',
      'read': '#64748b',
      'upload': '#f59e0b',
      'download': '#06b6d4'
    };
    return colors[action] || '#64748b';
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
      {/* Estatísticas de atividades */}
      <div className="activity-stats">
        <h3>Atividades Recentes</h3>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.action} className="stat-item">
              <span className="stat-icon">{getActionIcon(stat.action)}</span>
              <span className="stat-count">{stat.count}</span>
              <span className="stat-label">{getActionLabel(stat.action)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Tipo de Entidade</label>
          <select
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
          >
            <option value="">Todas</option>
            <option value="fine">Multas</option>
            <option value="client">Clientes</option>
            <option value="contract">Contratos</option>
            <option value="document">Documentos</option>
            <option value="user">Usuários</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Ação</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">Todas</option>
            <option value="create">Criação</option>
            <option value="update">Atualização</option>
            <option value="delete">Exclusão</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="status_changed">Status alterado</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Período</label>
          <select
            value={filters.date_range}
            onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
        <button 
          className="btn-reset" 
          onClick={() => setFilters({ entity_type: '', action: '', date_range: '30' })}
        >
          Limpar filtros
        </button>
      </div>

      {/* Lista de Atividades */}
      <div className="activity-list">
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma atividade registrada no período</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className="activity-card"
              onClick={() => handleViewEntityLogs(log)}
            >
              <div 
                className="activity-icon"
                style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}
              >
                {getActionIcon(log.action)}
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <span 
                    className="activity-action"
                    style={{ color: getActionColor(log.action) }}
                  >
                    {getActionLabel(log.action)}
                  </span>
                  <span className="activity-entity">
                    {getEntityLabel(log.entity_type)}
                  </span>
                </div>
                <p className="activity-description">{log.description}</p>
                <div className="activity-meta">
                  <span className="activity-user">
                    [User] {log.user_name || log.user_email || 'Sistema'}
                  </span>
                  <span className="activity-date">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              </div>
              {log.entity_type && log.entity_id && (
                <div className="activity-arrow">›</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-pagination"
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {page} de {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-pagination"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Histórico de {getEntityLabel(selectedLog.entity_type)}</h2>
              <button onClick={() => setSelectedLog(null)} className="btn-close">[X]</button>
            </div>
            <div className="modal-body">
              {loadingEntityLogs ? (
                <div className="loading">Carregando...</div>
              ) : entityLogs.length === 0 ? (
                <p className="empty-state">Nenhum histórico encontrado</p>
              ) : (
                <div className="history-timeline">
                  {entityLogs.map((log, index) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-marker">
                        <span style={{ color: getActionColor(log.action) }}>
                          {getActionIcon(log.action)}
                        </span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span style={{ color: getActionColor(log.action) }}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="timeline-date">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="timeline-description">{log.description}</p>
                        <span className="timeline-user">
                          [User] {log.user_name || log.user_email || 'Sistema'}
                        </span>
                      </div>
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

