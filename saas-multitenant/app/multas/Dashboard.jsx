'use client';

import { useState, useEffect } from 'react';
import {
  getFineDashboard,
  getFinesByOrgan,
  getFineAlerts,
  getUrgentFines,
  getOverdueFines,
  FINE_STATUS_LABELS,
  FINE_STAGE_LABELS
} from '../lib/finesAPI';
import { getClients } from '../lib/clientsAPI';
import { getAllContracts } from '../lib/contractsAPI';

// Labels dos estÃ¡gios APR usados nos contratos de MULTA
const APR_STAGES = [
  { key: 'APRS DEFESA PRÃ‰VIA',     label: 'APRS Defesa PrÃ©via',      color: '#6366f1' },
  { key: 'DEFESA PRÃ‰VIA - ANÃLISE',label: 'Defesa PrÃ©via - AnÃ¡lise', color: '#8b5cf6' },
  { key: 'APRS 1 INSTÃ‚NCIA',       label: 'APRS 1Âª InstÃ¢ncia',       color: '#f59e0b' },
  { key: '1 INSTÃ‚NCIA - ANÃLISE',  label: '1Âª InstÃ¢ncia - AnÃ¡lise',  color: '#f97316' },
  { key: 'APRS 2 INSTÃ‚NCIA',       label: 'APRS 2Âª InstÃ¢ncia',       color: '#ef4444' },
  { key: '2 INSTÃ‚NCIA -ANÃLISE',   label: '2Âª InstÃ¢ncia - AnÃ¡lise',  color: '#dc2626' },
];

export default function MultasDashboard() {
  const [stats, setStats] = useState(null);
  const [contractsByOrgan, setContractsByOrgan] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [urgentFines, setUrgentFines] = useState([]);
  const [overdueFines, setOverdueFines] = useState([]);
  const [aprStats, setAprStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alertType, setAlertType] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardData, organData, alertsData, urgentData, overdueData, clientsData, contractsData] =
        await Promise.all([
          getFineDashboard().catch(() => ({})),
          getFinesByOrgan().catch(() => []),
          getFineAlerts().catch(() => []),
          getUrgentFines(7).catch(() => []),
          getOverdueFines().catch(() => []),
          getClients().catch(() => []),
          getAllContracts().catch(() => []),
        ]);

      setStats({
        ...dashboardData,
        totalClients: clientsData?.length || 0
      });
      setContractsByOrgan(organData || []);
      setAlerts(alertsData || []);
      setUrgentFines(urgentData || []);
      setOverdueFines(overdueData || []);

      // Calcular APRs a partir dos contratos de MULTA
      const multaContracts = (contractsData || []).filter(
        c => c.service_name?.toUpperCase() === 'MULTA' || c.tipo?.toUpperCase() === 'MULTA'
      );

      const aprCounts = APR_STAGES.map(stage => {
        const count = multaContracts.filter(c => c.status === stage.key).length;
        return { ...stage, count };
      }).filter(s => s.count > 0);

      // Se nÃ£o vier do contractsAPI, tenta calcular via dashboard stats
      if (aprCounts.length === 0 && dashboardData) {
        const fallback = APR_STAGES.map(stage => ({
          ...stage,
          count: dashboardData[stage.key] || 0
        })).filter(s => s.count > 0);
        setAprStats(fallback);
      } else {
        setAprStats(aprCounts);
      }

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const getAlertColor = (type) => {
    const colors = { warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6' };
    return colors[type] || '#6b7280';
  };

  const getMaxOrganCount = () => {
    if (!contractsByOrgan.length) return 1;
    return Math.max(...contractsByOrgan.map(o => parseInt(o.count) || 0));
  };

  const getMaxAprCount = () => {
    if (!aprStats.length) return 1;
    return Math.max(...aprStats.map(s => s.count));
  };

  const openAlertsModal = (type) => {
    setAlertType(type);
    setShowAlertsModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Erro ao carregar dados: {error}</p>
        <button onClick={loadDashboard} className="btn-retry">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="multas-dashboard">

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3 className="section-title">Alertas</h3>
          <div className="alerts-grid">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`alert-card alert-${alert.type}`}
                onClick={() => openAlertsModal(alert.type)}
                style={{ borderLeftColor: getAlertColor(alert.type), cursor: 'pointer' }}
              >
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                </div>
                <div className="alert-count">{alert.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de Stats */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total de Multas</h3>
            <p className="stat-value">{stats?.total_fines ?? stats?.total ?? 0}</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-content">
            <h3>Pendentes</h3>
            <p className="stat-value">{stats?.pending_fines ?? stats?.pendente ?? 0}</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-content">
            <h3>Deferidas</h3>
            <p className="stat-value">{stats?.granted_fines ?? stats?.deferido ?? 0}</p>
          </div>
        </div>
        <div className="stat-card clients">
          <div className="stat-content">
            <h3>Total de Clientes</h3>
            <p className="stat-value">{stats?.totalClients || 0}</p>
          </div>
        </div>
      </div>

      {/* GrÃ¡fico de APRs */}
      <div className="charts-section">
        <h3 className="section-title">Clientes por EstÃ¡gio APR</h3>
        {aprStats.length > 0 ? (
          <div className="organ-chart">
            {aprStats.map((stage, index) => (
              <div key={index} className="organ-bar-container">
                <div className="organ-label">
                  <span className="organ-name">{stage.label}</span>
                  <span className="organ-count">{stage.count} cliente{stage.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="organ-bar-bg">
                  <div
                    className="organ-bar-fill"
                    style={{
                      width: `${(stage.count / getMaxAprCount()) * 100}%`,
                      backgroundColor: stage.color
                    }}
                  ></div>
                </div>
                <div className="organ-value" style={{ color: stage.color, fontWeight: 600 }}>
                  {stage.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart">
            <p>Nenhum cliente em estÃ¡gio APR no momento</p>
          </div>
        )}
      </div>

      {/* GrÃ¡fico por Ã“rgÃ£o */}
      <div className="charts-section">
        <h3 className="section-title">Multas por Ã“rgÃ£o</h3>
        {contractsByOrgan.length > 0 ? (
          <div className="organ-chart">
            {contractsByOrgan.map((organ, index) => (
              <div key={index} className="organ-bar-container">
                <div className="organ-label">
                  <span className="organ-name">{organ.organ || 'N/A'}</span>
                  <span className="organ-count">{organ.count} multas</span>
                </div>
                <div className="organ-bar-bg">
                  <div
                    className="organ-bar-fill"
                    style={{
                      width: `${((organ.count || 0) / getMaxOrganCount()) * 100}%`,
                      backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                    }}
                  ></div>
                </div>
                <div className="organ-value">{formatCurrency(organ.total_value)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart"><p>Nenhuma multa cadastrada ainda</p></div>
        )}
      </div>

      {/* Multas com Prazo PrÃ³ximo */}
      {urgentFines.length > 0 && (
        <div className="charts-section">
          <h3 className="section-title">Multas com Prazo PrÃ³ximo (7 dias)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>NÂº Multa</th>
                <th>Cliente</th>
                <th>Placa</th>
                <th>Ã“rgÃ£o</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {urgentFines.map((fine) => (
                <tr key={fine.id}>
                  <td>{fine.fine_number || '-'}</td>
                  <td>{fine.client_name || '-'}</td>
                  <td>{fine.plate || '-'}</td>
                  <td>{fine.organ || '-'}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatDate(fine.due_date)}</td>
                  <td>{FINE_STATUS_LABELS[fine.status] || fine.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Alertas */}
      {showAlertsModal && (
        <div className="modal-overlay" onClick={() => setShowAlertsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {alertType === 'warning' && 'Multas PrÃ³ximas ao Vencimento'}
                {alertType === 'danger' && 'Multas Vencidas'}
                {alertType === 'info' && 'InformaÃ§Ãµes'}
              </h2>
              <button onClick={() => setShowAlertsModal(false)} className="btn-close">âœ•</button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NÂº Multa</th>
                    <th>Cliente</th>
                    <th>Placa</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(alertType === 'warning' ? urgentFines : overdueFines).map((fine) => (
                    <tr key={fine.id}>
                      <td>{fine.fine_number || '-'}</td>
                      <td>{fine.client_name || '-'}</td>
                      <td>{fine.plate || '-'}</td>
                      <td className={alertType === 'danger' ? 'date-danger' : 'date-warning'}>
                        {formatDate(fine.due_date)}
                      </td>
                      <td>{FINE_STATUS_LABELS[fine.status] || fine.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
