'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';

export default function LeadsPerformance() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const leadsData = await leadsAPI.getAll();
      setLeads(leadsData);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas de performance (simulado - em produção viria do backend)
  const calculatePerformanceMetrics = () => {
    const total = leads.length;
    const gained = leads.filter(l => l.status === 'ganho').length;
    const lost = leads.filter(l => l.status === 'perdido').length;
    
    // Simular dados de vendedores (em produção isso seria real)
    const sellers = [
      { id: 1, name: 'João Silva', leads: Math.floor(total * 0.35), gained: Math.floor(gained * 0.4), conversion: 0 },
      { id: 2, name: 'Maria Santos', leads: Math.floor(total * 0.30), gained: Math.floor(gained * 0.35), conversion: 0 },
      { id: 3, name: 'Pedro Costa', leads: Math.floor(total * 0.20), gained: Math.floor(gained * 0.15), conversion: 0 },
      { id: 4, name: 'Ana Oliveira', leads: Math.floor(total * 0.15), gained: Math.floor(gained * 0.10), conversion: 0 },
    ];

    // Calcular conversões
    const withConversion = sellers.map(s => ({
      ...s,
      conversion: s.leads > 0 ? ((s.gained / s.leads) * 100).toFixed(1) : 0
    }));

    // Calcular receita gerada (simulado)
    const revenuePerDeal = 15000; // R$ 15.000 médio
    const withRevenue = withConversion.map(s => ({
      ...s,
      revenue: s.gained * revenuePerDeal
    }));

    // Ranking por leads ganhos
    const ranking = [...withRevenue].sort((a, b) => b.gained - a.gained);

    // Métricas gerais
    const avgConversion = total > 0 ? ((gained / total) * 100).toFixed(1) : 0;
    const avgTimeToClose = 15; // Dias (simulado)
    const totalRevenue = gained * revenuePerDeal;

    return {
      total,
      gained,
      lost,
      avgConversion,
      avgTimeToClose,
      totalRevenue,
      ranking
    };
  };

  const metrics = calculatePerformanceMetrics();

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <div className="loading">Carregando Performance...</div>;
  }

  return (
    <div className="performance-container">
      {/* KPIs de Performance */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{metrics.total}</div>
          <div className="kpi-label">Total de Leads</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">{metrics.gained}</div>
          <div className="kpi-label">Fechados</div>
        </div>
        
        <div className="kpi-card danger">
          <div className="kpi-value">{metrics.lost}</div>
          <div className="kpi-label">Perdidos</div>
        </div>
        
        <div className="kpi-card warning">
          <div className="kpi-value">{metrics.avgConversion}%</div>
          <div className="kpi-label">Conversão Média</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">{metrics.avgTimeToClose}</div>
          <div className="kpi-label">Dias Médios para Fechar</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="kpi-label">Receita Gerada</div>
        </div>
      </div>

      {/* Ranking Comercial */}
      <div className="section">
        <h3>Ranking Comercial</h3>
        <div className="ranking-list">
          {metrics.ranking.map((seller, index) => (
            <div key={seller.id} className={`ranking-card rank-${index + 1}`}>
              <div className="ranking-position">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="ranking-info">
                <div className="ranking-name">{seller.name}</div>
                <div className="ranking-stats">
                  <span>{seller.leads} leads</span>
                  <span>•</span>
                  <span>{seller.gained} ganhos</span>
                  <span>•</span>
                  <span>{seller.conversion}% conversão</span>
                </div>
              </div>
              <div className="ranking-revenue">
                {formatCurrency(seller.revenue)}
              </div>
              <div className="ranking-bar-container">
                <div 
                  className="ranking-bar" 
                  style={{ 
                    width: `${(seller.gained / Math.max(...metrics.ranking.map(s => s.gained))) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparativo Individual vs Média */}
      <div className="section">
        <h3>Comparativo: Individual vs Média</h3>
        <div className="comparison-grid">
          {metrics.ranking.map((seller) => {
            const aboveAvg = parseFloat(seller.conversion) > parseFloat(metrics.avgConversion);
            return (
              <div key={seller.id} className="comparison-card">
                <div className="comparison-header">
                  <span className="comparison-name">{seller.name}</span>
                  <span className={`comparison-badge ${aboveAvg ? 'positive' : 'negative'}`}>
                    {aboveAvg ? '↑ Acima' : '↓ Abaixo'} da média
                  </span>
                </div>
                <div className="comparison-stats">
                  <div className="comparison-stat">
                    <span className="stat-value">{seller.leads}</span>
                    <span className="stat-label">Leads</span>
                  </div>
                  <div className="comparison-stat">
                    <span className="stat-value">{seller.gained}</span>
                    <span className="stat-label">Ganhos</span>
                  </div>
                  <div className="comparison-stat highlight">
                    <span className="stat-value">{seller.conversion}%</span>
                    <span className="stat-label">Conversão</span>
                  </div>
                </div>
                <div className="comparison-bar">
                  <div className="comparison-bar-label">Média da empresa: {metrics.avgConversion}%</div>
                  <div className="comparison-bar-track">
                    <div 
                      className="comparison-bar-fill average" 
                      style={{ width: `${metrics.avgConversion}%` }}
                    />
                    <div 
                      className={`comparison-bar-fill individual ${aboveAvg ? 'positive' : 'negative'}`}
                      style={{ left: `${Math.min(parseFloat(seller.conversion), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico Comparativo */}
      <div className="section">
        <h3>Desempenho por Vendedor</h3>
        <div className="performance-chart">
          {metrics.ranking.map((seller) => {
            const maxLeads = Math.max(...metrics.ranking.map(s => s.leads));
            const maxGained = Math.max(...metrics.ranking.map(s => s.gained));
            
            return (
              <div key={seller.id} className="chart-row">
                <div className="chart-label">{seller.name}</div>
                <div className="chart-bars">
                  <div className="chart-bar-group">
                    <div 
                      className="chart-bar leads"
                      style={{ width: `${(seller.leads / maxLeads) * 100}%` }}
                      title={`${seller.leads} Leads`}
                    >
                      <span className="bar-tooltip">{seller.leads}</span>
                    </div>
                    <span className="bar-label">Leads</span>
                  </div>
                  <div className="chart-bar-group">
                    <div 
                      className="chart-bar gained"
                      style={{ width: `${(seller.gained / maxGained) * 100}%` }}
                      title={`${seller.gained} Ganhos`}
                    >
                      <span className="bar-tooltip">{seller.gained}</span>
                    </div>
                    <span className="bar-label">Ganhos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span><span className="legend-dot leads"></span>Leads</span>
          <span><span className="legend-dot gained"></span>Ganhos</span>
        </div>
      </div>
    </div>
  );
}

