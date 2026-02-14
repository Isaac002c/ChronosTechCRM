'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';

export default function Reports() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const leadsData = await leadsAPI.getAll();
      setLeads(leadsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas
  const calculateMetrics = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const total = leads.length;
    const newThisWeek = leads.filter(l => new Date(l.created_at) > weekAgo).length;
    const newThisMonth = leads.filter(l => new Date(l.created_at) > monthAgo).length;
    
    const gained = leads.filter(l => l.status === 'ganho').length;
    const lost = leads.filter(l => l.status === 'perdido').length;
    
    const conversionRate = total > 0 ? ((gained / total) * 100).toFixed(1) : 0;
    
    // Por fonte
    const bySource = {};
    leads.forEach(lead => {
      const source = lead.source || 'outro';
      bySource[source] = (bySource[source] || 0) + 1;
    });
    
    // Por status
    const byStatus = {};
    leads.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    return {
      total,
      newThisWeek,
      newThisMonth,
      gained,
      lost,
      conversionRate,
      bySource,
      byStatus,
    };
  };

  const metrics = calculateMetrics();

  // Calcular crescimento (simulado - em produção viria do backend)
  const calculateGrowth = () => {
    const currentMonth = metrics.newThisMonth;
    const previousMonth = Math.round(currentMonth * 0.8); // Simulando 20% menos no mês anterior
    const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100).toFixed(1) : 0;
    return { currentMonth, previousMonth, growth };
  };

  const growth = calculateGrowth();

  // Simular meta vs realizado
  const target = 100; // Meta mensal
  const achieved = metrics.gained;
  const targetProgress = Math.min((achieved / target) * 100, 100);

  if (loading) {
    return <div className="loading">Carregando Relatórios...</div>;
  }

  return (
    <div className="reports-container">
      {/* Seletor de Período */}
      <div className="period-selector">
        <button 
          className={`period-btn ${period === 'week' ? 'active' : ''}`}
          onClick={() => setPeriod('week')}
        >
          7 Dias
        </button>
        <button 
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => setPeriod('month')}
        >
          30 Dias
        </button>
        <button 
          className={`period-btn ${period === 'quarter' ? 'active' : ''}`}
          onClick={() => setPeriod('quarter')}
        >
          Trimestre
        </button>
        <button 
          className={`period-btn ${period === 'year' ? 'active' : ''}`}
          onClick={() => setPeriod('year')}
        >
          Ano
        </button>
      </div>

      {/* KPIs Principais */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{metrics.total}</div>
          <div className="kpi-label">Total de Leads</div>
          <div className="kpi-change positive">+{metrics.newThisWeek} esta semana</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">{metrics.gained}</div>
          <div className="kpi-label">Leads Ganhos</div>
        </div>
        
        <div className="kpi-card danger">
          <div className="kpi-value">{metrics.lost}</div>
          <div className="kpi-label">Leads Perdidos</div>
        </div>
        
        <div className="kpi-card warning">
          <div className="kpi-value">{metrics.conversionRate}%</div>
          <div className="kpi-label">Taxa de Conversão</div>
        </div>
      </div>

      {/* Comparação Mensal */}
      <div className="section">
        <h3>Crescimento</h3>
        <div className="growth-comparison">
          <div className="growth-card current">
            <div className="growth-period">Mês Atual</div>
            <div className="growth-value">{growth.currentMonth}</div>
            <div className="growth-label">novos leads</div>
          </div>
          <div className="growth-arrow">→</div>
          <div className="growth-card previous">
            <div className="growth-period">Mês Anterior</div>
            <div className="growth-value">{growth.previousMonth}</div>
            <div className="growth-label">novos leads</div>
          </div>
          <div className={`growth-percent ${growth.growth >= 0 ? 'positive' : 'negative'}`}>
            {growth.growth >= 0 ? '↑' : '↓'} {Math.abs(growth.growth)}%
          </div>
        </div>
      </div>

      {/* Meta vs Realizado */}
      <div className="section">
        <h3>Meta vs Realizado</h3>
        <div className="target-card">
          <div className="target-header">
            <span>Leads Ganhos no Mês</span>
            <span>{achieved} / {target}</span>
          </div>
          <div className="target-bar">
            <div 
              className="target-fill" 
              style={{ width: `${targetProgress}%` }}
            ></div>
          </div>
          <div className="target-footer">
            {targetProgress >= 100 ? (
              <span className="target-achieved">✅ Meta alcanzada!</span>
            ) : (
              <span>Faltam {target - achieved} para atingir a meta</span>
            )}
          </div>
        </div>
      </div>

      {/* Distribuição por Status */}
      <div className="section">
        <h3>Distribuição por Status</h3>
        <div className="distribution-grid">
          {Object.entries(metrics.byStatus).map(([status, count]) => {
            const percentage = metrics.total > 0 ? (count / metrics.total * 100).toFixed(1) : 0;
            const colors = {
              novo: '#3B82F6',
              contactado: '#F59E0B',
              qualificado: '#8B5CF6',
              proposta: '#06B6D4',
              ganho: '#22C55E',
              perdido: '#EF4444'
            };
            return (
              <div key={status} className="distribution-card">
                <div className="distribution-header">
                  <span className="distribution-status" style={{ color: colors[status] }}>{status}</span>
                  <span className="distribution-count">{count}</span>
                </div>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colors[status]
                    }}
                  ></div>
                </div>
                <div className="distribution-percent">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribuição por Fonte */}
      <div className="section">
        <h3>Distribuição por Fonte</h3>
        <div className="sources-grid">
          {Object.entries(metrics.bySource).map(([source, count]) => {
            const percentage = metrics.total > 0 ? (count / metrics.total * 100).toFixed(1) : 0;
            return (
              <div key={source} className="source-card">
                <div className="source-header">
                  <span className="source-name">{source}</span>
                  <span className="source-count">{count}</span>
                </div>
                <div className="source-bar">
                  <div 
                    className="source-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="source-percent">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="section">
        <h3>Resumo Executivo</h3>
        <div className="executive-summary">
          <p>
            No período selecionado, o CRM captou <strong>{metrics.total} leads</strong>, 
            sendo <strong>{metrics.newThisWeek}</strong> apenas nesta semana. 
            A taxa de conversão atual é de <strong>{metrics.conversionRate}%</strong>, 
            com <strong>{metrics.gained}</strong> deals fechados e <strong>{metrics.lost}</strong> perdidos.
          </p>
          <p>
            {growth.growth >= 0 ? (
              <>O crescimento em relação ao mês anterior foi de <strong>{growth.growth}%</strong>, indicando uma tendência positiva.</>
            ) : (
              <>Houve uma queda de <strong>{Math.abs(growth.growth)}%</strong> em relação ao mês anterior. Recomenda-se revisar a estratégia de aquisição.</>
            )}
          </p>
          {targetProgress >= 100 ? (
            <p>✅ <strong>Parabéns!</strong> A meta mensal de {target} leads ganhos foi alcançada!</p>
          ) : (
            <p>📊 Faltam <strong>{target - achieved}</strong> leads ganhos para atingir a meta mensal de {target}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

