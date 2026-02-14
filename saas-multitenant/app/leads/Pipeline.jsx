'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

  const stages = [
    { key: 'novo', label: 'Novo', color: '#3B82F6' },
    { key: 'contactado', label: 'Contactado', color: '#F59E0B' },
    { key: 'qualificado', label: 'Qualificado', color: '#8B5CF6' },
    { key: 'proposta', label: 'Proposta', color: '#06B6D4' },
    { key: 'ganho', label: 'Ganho', color: '#22C55E' },
    { key: 'perdido', label: 'Perdido', color: '#EF4444' },
  ];

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

  const getLeadsByStage = (stageKey) => {
    return leads.filter(lead => lead.status === stageKey);
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === newStatus) return;

    try {
      await leadsAPI.update(draggedLead.id, { status: newStatus });
      setLeads(leads.map(lead => 
        lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Erro ao mover lead:', err);
    }
    setDraggedLead(null);
  };

  // Calcular métricas do funil
  const getFunnelMetrics = () => {
    const total = leads.length;
    const byStage = stages.map(stage => ({
      ...stage,
      count: getLeadsByStage(stage.key).length,
      percentage: total > 0 ? Math.round((getLeadsByStage(stage.key).length / total) * 100) : 0
    }));
    return { total, byStage };
  };

  const funnelMetrics = getFunnelMetrics();

  if (loading) {
    return <div className="loading">Carregando Pipeline...</div>;
  }

  return (
    <div className="pipeline-container">
      {/* KPIs do Pipeline */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{funnelMetrics.total}</div>
          <div className="kpi-label">Total de Leads</div>
        </div>
        {stages.slice(0, 4).map(stage => (
          <div key={stage.key} className="kpi-card" style={{ borderLeftColor: stage.color }}>
            <div className="kpi-value">{getLeadsByStage(stage.key).length}</div>
            <div className="kpi-label">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* Funil Visual */}
      <div className="section">
        <h3>Funil de Vendas</h3>
        <div className="funnel-visual">
          {funnelMetrics.byStage.map((stage, index) => (
            <div key={stage.key} className="funnel-stage">
              <div 
                className="funnel-bar" 
                style={{ 
                  width: `${Math.max(stage.percentage, 5)}%`,
                  backgroundColor: stage.color 
                }}
              >
                <span>{stage.percentage}%</span>
              </div>
              <div className="funnel-info">
                <span className="funnel-label">{stage.label}</span>
                <span className="funnel-count">{stage.count} leads</span>
              </div>
              {index < funnelMetrics.byStage.length - 1 && (
                <div className="funnel-arrow">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="section">
        <h3>Pipeline Kanban</h3>
        <div className="kanban-board">
          {stages.map(stage => (
            <div 
              key={stage.key}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="kanban-header" style={{ borderTopColor: stage.color }}>
                <span className="kanban-title">{stage.label}</span>
                <span className="kanban-count">{getLeadsByStage(stage.key).length}</span>
              </div>
              <div className="kanban-cards">
                {getLeadsByStage(stage.key).map(lead => (
                  <div 
                    key={lead.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                  >
                    <div className="kanban-card-name">{lead.name}</div>
                    <div className="kanban-card-company">{lead.company || 'Sem empresa'}</div>
                    <div className="kanban-card-source">{lead.source || 'Sem origem'}</div>
                  </div>
                ))}
                {getLeadsByStage(stage.key).length === 0 && (
                  <div className="kanban-empty">Nenhum lead</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

