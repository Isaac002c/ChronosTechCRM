'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';
import targetsAPI from '../lib/targetsAPI';

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [inactiveLeads, setInactiveLeads] = useState([]);
  const [activityForm, setActivityForm] = useState({
    type: 'followup',
    description: '',
    due_date: ''
  });

  const stages = [
    { key: 'novo', label: 'Novo', color: '#3B82F6' },
    { key: 'contactado', label: 'Contactado', color: '#F59E0B' },
    { key: 'qualificado', label: 'Qualificado', color: '#8B5CF6' },
    { key: 'proposta', label: 'Proposta', color: '#10B981' },
    { key: 'negociacao', label: 'Negociação', color: '#06B6D4' },
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
      
      // Carregar leads inativos (sem atividade há 7 dias)
      try {
        const inactive = await targetsAPI.getInactiveLeads(7);
        setInactiveLeads(inactive);
      } catch (e) {
        console.log('Leads inativos não disponíveis');
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByStage = (stageKey) => {
    return leads.filter(lead => lead.status === stageKey);
  };

  const getStageValue = (stageKey) => {
    return getLeadsByStage(stageKey).reduce((sum, lead) => sum + (lead.value || 15000), 0);
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
      await leadsAPI.update(draggedLead.id, { ...draggedLead, status: newStatus });
      setLeads(leads.map(lead => 
        lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Erro ao mover lead:', err);
    }
    setDraggedLead(null);
  };

  // ========== SCORE AUTOMÁTICO ==========
  const calculateLeadScore = (lead) => {
    let score = 0;
    
    // Por valor
    if (lead.value > 5000) score += 20;
    else if (lead.value > 2000) score += 10;
    
    // Por estágio
    if (lead.status === 'proposta' || lead.status === 'negociacao') score += 15;
    else if (lead.status === 'qualificado') score += 10;
    else if (lead.status === 'contactado') score += 5;
    
    // Por canal
    if (lead.source === 'indicacao') score += 15;
    else if (lead.source === 'site') score += 10;
    
    return score;
  };

  const getLeadTemperature = (score) => {
    if (score >= 30) return { label: 'Quente', emoji: '🔥', color: '#EF4444' };
    if (score >= 15) return { label: 'Morno', emoji: '🟡', color: '#F59E0B' };
    return { label: 'Frio', emoji: '❄️', color: '#3B82F6' };
  };

  // ========== ATIVIDADES ==========
  const openActivityModal = async (lead) => {
    setSelectedLead(lead);
    setShowActivityModal(true);
    setActivityForm({ type: 'followup', description: '', due_date: '' });
    
    // Carregar atividades do lead
    try {
      const leadActivities = await targetsAPI.getLeadActivities(lead.id);
      setActivities(leadActivities);
    } catch (e) {
      setActivities([]);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    try {
      await targetsAPI.createActivity({
        lead_id: selectedLead.id,
        type: activityForm.type,
        description: activityForm.description,
        due_date: activityForm.due_date || null
      });
      
      // Recarregar atividades
      const leadActivities = await targetsAPI.getLeadActivities(selectedLead.id);
      setActivities(leadActivities);
      setActivityForm({ type: 'followup', description: '', due_date: '' });
      
      alert('Atividade criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar atividade:', err);
      alert('Erro ao criar atividade');
    }
  };

  const handleCompleteActivity = async (activityId) => {
    try {
      await targetsAPI.completeActivity(activityId);
      
      // Recarregar atividades
      const leadActivities = await targetsAPI.getLeadActivities(selectedLead.id);
      setActivities(leadActivities);
    } catch (err) {
      console.error('Erro ao completar atividade:', err);
    }
  };

  // Calcular métricas do funil
  const getFunnelMetrics = () => {
    const total = leads.length;
    const byStage = stages.map(stage => ({
      ...stage,
      count: getLeadsByStage(stage.key).length,
      value: getStageValue(stage.key),
      percentage: total > 0 ? Math.round((getLeadsByStage(stage.key).length / total) * 100) : 0
    }));
    return { total, byStage };
  };

  const funnelMetrics = getFunnelMetrics();

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      ligacao: '📞 Ligação',
      email: '📧 Email',
      reuniao: '📅 Reunião',
      followup: '🔄 Follow-up',
      tarefa: '✅ Tarefa'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">Carregando Pipeline...</div>;
  }

  return (
    <div className="pipeline-container">
      {/* ========== LEADS INATIVOS (ALERTA) ========== */}
      {inactiveLeads.length > 0 && (
        <div className="alert-box warning">
          <div className="alert-header">
            <span>⚠️ Leads sem atividade há 7+ dias</span>
            <span className="alert-count">{inactiveLeads.length}</span>
          </div>
          <div className="alert-list">
            {inactiveLeads.slice(0, 5).map(lead => (
              <div key={lead.id} className="alert-item">
                <span className="alert-name">{lead.name}</span>
                <span className="alert-days">{Math.floor(lead.days_inactive)} dias</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs do Pipeline */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{funnelMetrics.total}</div>
          <div className="kpi-label">Total de Leads</div>
        </div>
        {stages.slice(0, 5).map(stage => (
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
                <span className="funnel-count">{stage.count} leads • {formatCurrency(stage.value)}</span>
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
                <div>
                  <span className="kanban-title">{stage.label}</span>
                  <div className="kanban-total">{formatCurrency(getStageValue(stage.key))}</div>
                </div>
                <span className="kanban-count">{getLeadsByStage(stage.key).length}</span>
              </div>
              <div className="kanban-cards">
                {getLeadsByStage(stage.key).map(lead => {
                  const score = calculateLeadScore(lead);
                  const temp = getLeadTemperature(score);
                  
                  return (
                    <div 
                      key={lead.id}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                    >
                      {/* Badge de Temperatura */}
                      <div className="kanban-card-temp" style={{ backgroundColor: temp.color }}>
                        {temp.emoji}
                      </div>
                      
                      <div className="kanban-card-name">{lead.name}</div>
                      <div className="kanban-card-company">{lead.company || 'Sem empresa'}</div>
                      <div className="kanban-card-value">{formatCurrency(lead.value || 15000)}</div>
                      <div className="kanban-card-meta">
                        <span className="kanban-card-source">{lead.source || 'Sem origem'}</span>
                        <span className="kanban-card-date">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                      
                      {/* Botão de Atividade */}
                      <button 
                        className="kanban-card-action"
                        onClick={() => openActivityModal(lead)}
                        title="Adicionar Atividade"
                      >
                        📋 Tarefa
                      </button>
                    </div>
                  );
                })}
                {getLeadsByStage(stage.key).length === 0 && (
                  <div className="kanban-empty">Nenhum lead</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== MODAL DE ATIVIDADES ========== */}
      {showActivityModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h3>📋 Atividades - {selectedLead.name}</h3>
            
            {/* Formulário de nova atividade */}
            <form onSubmit={handleCreateActivity} className="activity-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select 
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                  >
                    <option value="ligacao">📞 Ligação</option>
                    <option value="email">📧 Email</option>
                    <option value="reuniao">📅 Reunião</option>
                    <option value="followup">🔄 Follow-up</option>
                    <option value="tarefa">✅ Tarefa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input
                    type="date"
                    value={activityForm.due_date}
                    onChange={(e) => setActivityForm({...activityForm, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  placeholder="Descreva a atividade..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
                  rows={2}
                />
              </div>
              <button type="submit" className="btn-primary">
                + Adicionar Atividade
              </button>
            </form>

            {/* Lista de atividades */}
            <div className="activities-list">
              <h4>Histórico de Atividades</h4>
              {activities.length === 0 ? (
                <p className="no-data">Nenhuma atividade registrada</p>
              ) : (
                <div className="activity-items">
                  {activities.map(activity => (
                    <div 
                      key={activity.id} 
                      className={`activity-item ${activity.completed ? 'completed' : ''}`}
                    >
                      <div className="activity-info">
                        <span className="activity-type">{getActivityTypeLabel(activity.type)}</span>
                        <span className="activity-desc">{activity.description || 'Sem descrição'}</span>
                        {activity.due_date && (
                          <span className={`activity-due ${new Date(activity.due_date) < new Date() && !activity.completed ? 'overdue' : ''}`}>
                            📅 {formatDate(activity.due_date)}
                          </span>
                        )}
                      </div>
                      <div className="activity-actions">
                        {!activity.completed && (
                          <button 
                            className="btn-small success"
                            onClick={() => handleCompleteActivity(activity.id)}
                          >
                            ✓ Concluir
                          </button>
                        )}
                        {activity.completed && (
                          <span className="activity-completed">✅ Concluída</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="btn-secondary" 
              onClick={() => setShowActivityModal(false)}
              style={{ marginTop: '20px' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

