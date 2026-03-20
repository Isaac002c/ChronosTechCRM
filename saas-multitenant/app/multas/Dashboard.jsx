'use client';

import { useState, useEffect } from 'react';
import { 
  getFineDashboard, 
  getFinesByOrgan, 
  getFineAlerts,
  getUrgentFines,
  getOverdueFines
} from '../lib/finesAPI';
import { getClients } from '../lib/clientsAPI';
import { getFines } from '../lib/finesAPI';

export default function MultasDashboard() {
  const [stats, setStats] = useState(null);
  const [contractsByOrgan, setContractsByOrgan] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [nearDueContracts, setNearDueContracts] = useState([]);
  const [overdueContracts, setOverdueContracts] = useState([]); 
  const [aprData, setAprData] = useState([]);
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
      const [
        dashboardData, 
        organData, 
        alertsData,
        urgentData,
        overdueData,
        clientsData
      ] = await Promise.all([
        getFineDashboard(),
        getFinesByOrgan(),
        getFineAlerts(),
        getUrgentFines(7),
        getOverdueFines(),
        getClients()
      ]);
      
      setStats({
        ...dashboardData,
        totalClients: clientsData.length
      });
      setContractsByOrgan(organData || []);
      setAlerts(alertsData || []);
      setNearDueContracts(urgentData || []);
      setOverdueContracts(overdueData || []);
      setAprData([]); // No APR for fines
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return 'Aviso';
      case 'danger': return 'Erro';
      case 'info': return 'Info';
      default: return 'Alerta';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return '#f59e0b';
      case 'danger': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const openAlertsModal = (type) => {
    setAlertType(type);
    setShowAlertsModal(true);
  };

  const getMaxSellerCount = () => {
    if (!aprData.length) return 1;
    return Math.max(...aprData.map(s => parseInt(s.granted_count) || 0));
  };

  const getMaxOrganCount = () => {
    if (!contractsByOrgan.length) return 1;
    return Math.max(...contractsByOrgan.map(o => parseInt(o.count) || 0));
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
        <button onClick={loadDashboard} className="btn-retry">
          Tentar novamente
        </button>
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
                style={{ borderLeftColor: getAlertColor(alert.type) }}
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

      {/* Stats Grid - Cards removidos: Valor Total e Valor Ativo */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total de Contratos</h3>
            <p className="stat-value">{stats?.total_contracts || 0}</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-content">
            <h3>Contratos Ativos</h3>
            <p className="stat-value">{stats?.active_contracts || 0}</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-content">
            <h3>Concluídos</h3>
            <p className="stat-value">{stats?.completed_contracts || 0}</p>
          </div>
        </div>
        <div className="stat-card clients">
          <div className="stat-content">
            <h3>Total de Clientes</h3>
            <p className="stat-value">{stats?.totalClients || 0}</p>
          </div>
        </div>
      </div>

      {/* Gráfico Registros APR */}
      <div className="charts-section">
        <h3 className="section-title">Gráfico - Registros APR</h3>
        {aprData.length > 0 ? (
          <div className="organ-chart">
            {aprData.map((seller, index) => (
              <div key={index} className="organ-bar-container">
                <div className="organ-label">
                  <span className="organ-name">{seller.seller_name || 'N/A'}</span>
                  <span className="organ-count">{seller.granted_count || 0} APR</span>
                </div>
                <div className="organ-bar-bg">
                  <div 
                    className="organ-bar-fill"
                    style={{ 
                      width: `${((seller.granted_count || 0) / getMaxSellerCount()) * 100}%`,
                      backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart">
            <p>Nenhum registro APR encontrado</p>
          </div>
        )}
      </div>

      {/* Gráfico Contratos por Órgão (existente) */}
      <div className="charts-section">
        <h3 className="section-title">Gráfico - Contratos por Órgão</h3>
        {contractsByOrgan.length > 0 ? (
          <div className="organ-chart">
            {contractsByOrgan.map((organ, index) => (
              <div key={index} className="organ-bar-container">
                <div className="organ-label">
                  <span className="organ-name">{organ.organ || 'N/A'}</span>
                  <span className="organ-count">{organ.count} contratos</span>
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
          <div className="empty-chart">
            <p>Nenhum contrato cadastrado ainda</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="dashboard-info">
        <div className="info-card">
          <h4>Resumo - Módulo de Multas</h4>
          <ul>
            <li>Gerencie contratos de multas de trânsito</li>
            <li>Cadastre clientes e proprietários de veículos</li>
            <li>Acompanhe o status dos contratos</li>
            <li>Organize documentos digitalizados</li>
            <li>Receba alertas de contratos próximos ao vencimento</li>
          </ul>
        </div>
      </div>

      {/* Modal de Alertas */}
      {showAlertsModal && (
        <div className="modal-overlay" onClick={() => setShowAlertsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {alertType === 'warning' && 'Aviso: Contratos Próximos ao Vencimento'}
                {alertType === 'danger' && 'Erro: Contratos Vencidos'}
                {alertType === 'info' && 'Info: Contratos Sem Atualização'}
              </h2>
              <button onClick={() => setShowAlertsModal(false)} className="btn-close">[X]</button>
            </div>
            <div className="modal-body">
              {alertType === 'warning' && nearDueContracts.length === 0 && (
                <p className="empty-state">Nenhum contrato próximo ao vencimento</p>
              )}
              {alertType === 'danger' && overdueContracts.length === 0 && (
                <p className="empty-state">Nenhum contrato vencido</p>
              )}
              
              {(alertType === 'warning' || alertType === 'danger') && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contrato</th>
                      <th>Cliente</th>
                      <th>Placa</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertType === 'warning' && nearDueContracts.map((contract) => (
                      <tr key={contract.id}>
                        <td>{contract.contract_number || '-'}</td>
                        <td>{contract.client_name || '-'}</td>
                        <td>{contract.vehicle_plate || '-'}</td>
                        <td>{formatCurrency(contract.value)}</td>
                        <td className="date-warning">{formatDate(contract.due_date)}</td>
                      </tr>
                    ))}
                    {alertType === 'danger' && overdueContracts.map((contract) => (
                      <tr key={contract.id}>
                        <td>{contract.contract_number || '-'}</td>
                        <td>{contract.client_name || '-'}</td>
                        <td>{contract.vehicle_plate || '-'}</td>
                        <td>{formatCurrency(contract.value)}</td>
                        <td className="date-danger">{formatDate(contract.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

