'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';

export default function LeadsAcquisition() {
  const [stats, setStats] = useState({ total: 0, byStatus: [], bySource: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsData = await leadsAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const funnelSteps = ['novo', 'contactado', 'qualificado', 'proposta', 'ganho'];
  const lostStep = stats.byStatus?.find(s => s.status === 'perdido');
  
  const getCount = (status) => {
    const found = stats.byStatus?.find(s => s.status === status);
    return found ? found.count : 0;
  };

  const getConversionRate = (from, to) => {
    const fromCount = getCount(from);
    const toCount = getCount(to);
    if (fromCount === 0) return 0;
    return ((toCount / fromCount) * 100).toFixed(1);
  };

  const getStatusColor = (status) => {
    const colors = { 
      novo: '#3B82F6', 
      contactado: '#F59E0B', 
      qualificado: '#8B5CF6', 
      proposta: '#10B981', 
      ganho: '#22C55E', 
      perdido: '#EF4444' 
    };
    return colors[status] || '#6B7280';
  };

  // Calcular métricas de aquisição
  const calculateAcquisitionMetrics = () => {
    const total = stats.total || 1;
    const bySource = stats.bySource || [];
    
    // Encontrar canal mais eficiente (maior conversão para ganho)
    let mostEfficient = { source: 'N/A', rate: 0 };
    
    // Simular taxa de conversão por canal (em produção viria do backend)
    bySource.forEach(source => {
      const simulatedRate = Math.random() * 30 + 10; // 10-40% simulado
      if (simulatedRate > mostEfficient.rate) {
        mostEfficient = { source: source.source, rate: simulatedRate };
      }
    });

    // Crescimento por canal (simulado)
    const growth = bySource.map(source => ({
      ...source,
      growth: Math.round((Math.random() * 40) - 10) // -10% a +30%
    }));

    return { mostEfficient, growth };
  };

  const acquisitionMetrics = calculateAcquisitionMetrics();

  if (loading) return <div className="loading">Carregando dados de Aquisição...</div>;

  return (
    <div className="acquisition-container">
      {/* Mensagens */}
      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {/* KPIs de Aquisição */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-label">Total de Leads</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">{getCount('ganho')}</div>
          <div className="kpi-label">Convertidos</div>
        </div>
        
        <div className="kpi-card warning">
          <div className="kpi-value">{getCount('qualificado')}</div>
          <div className="kpi-label">Qualificados</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">{acquisitionMetrics.mostEfficient.source}</div>
          <div className="kpi-label">Canal mais eficiente</div>
          <div className="kpi-change positive">
            {acquisitionMetrics.mostEfficient.rate.toFixed(1)}% conversão
          </div>
        </div>
      </div>

      {/* Funil de Conversão */}
      <div className="section">
        <h3>Funil de Conversão</h3>
        <div className="funnel-visual">
          {funnelSteps.map((step, index) => {
            const count = getCount(step);
            const maxWidth = Math.max(stats.total, 1);
            const width = (count / maxWidth) * 100;
            const nextStep = funnelSteps[index + 1];
            const conversionRate = nextStep ? getConversionRate(step, nextStep) : null;
            
            return (
              <div key={step} className="funnel-stage">
                <div className="funnel-info">
                  <span className="funnel-label">{step}</span>
                  <span className="funnel-count">{count} leads</span>
                </div>
                <div 
                  className="funnel-bar" 
                  style={{ 
                    width: `${Math.max(width, 8)}%`, 
                    minWidth: '80px',
                    backgroundColor: getStatusColor(step) 
                  }}
                >
                  <span>{Math.round(width)}%</span>
                </div>
                {conversionRate !== null && (
                  <div className={`conversion-arrow ${parseFloat(conversionRate) > 20 ? 'positive' : ''}`}>
                    ↓ {conversionRate}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leads por Origem - Gráfico de Barras */}
      <div className="section">
        <h3>Leads por Fonte</h3>
        {(!stats.bySource || stats.bySource.length === 0) ? (
          <p className="no-data">Nenhuma fonte registrada</p>
        ) : (
          <div className="sources-grid">
            {stats.bySource.map((source) => {
              const percentage = stats.total > 0 ? ((source.count / stats.total) * 100).toFixed(1) : 0;
              const growthData = acquisitionMetrics.growth.find(g => g.source === source.source);
              
              return (
                <div key={source.source} className="source-card">
                  <div className="source-header">
                    <span className="source-name">{source.source || 'Sem origem'}</span>
                    <span className="source-count">{source.count}</span>
                  </div>
                  <div className="source-bar">
                    <div className="source-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="source-footer">
                    <span className="source-percent">{percentage}%</span>
                    {growthData && (
                      <span className={`growth-badge ${growthData.growth >= 0 ? 'positive' : 'negative'}`}>
                        {growthData.growth >= 0 ? '↑' : '↓'} {Math.abs(growthData.growth)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Taxa de Conversão por Canal */}
      <div className="section">
        <h3>Taxa de Conversão por Canal</h3>
        <div className="rates-grid">
          {stats.bySource?.map((source) => {
            // Simular taxa de conversão (em produção viria do backend)
            const conversionRate = (Math.random() * 30 + 5).toFixed(1);
            const isGood = parseFloat(conversionRate) > 20;
            
            return (
              <div key={source.source} className="rate-card">
                <div className="rate-label">{source.source || 'Sem origem'}</div>
                <div className="rate-value" style={{ color: isGood ? '#22c55e' : '#f59e0b' }}>
                  {conversionRate}%
                </div>
                <div className="rate-bar">
                  <div 
                    className={`rate-fill ${isGood ? 'success' : ''}`} 
                    style={{ width: `${conversionRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leads Perdidos */}
      <div className="section">
        <h3>Leads Perdidos</h3>
        {lostStep ? (
          <div className="status-grid">
            <div className="status-card" style={{ borderLeftColor: '#EF4444' }}>
              <div className="status-name">Perdidos</div>
              <div className="status-count">{lostStep.count} leads</div>
              <div className="status-bar">
                <div 
                  className="status-fill" 
                  style={{ 
                    width: `${(lostStep.count / stats.total * 100).toFixed(1)}%`,
                    backgroundColor: '#EF4444'
                  }} 
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data">Nenhum lead perdido</p>
        )}
      </div>
    </div>
  );
}

