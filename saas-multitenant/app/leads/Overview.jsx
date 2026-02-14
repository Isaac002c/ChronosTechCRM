'use client';

import { useState, useEffect } from 'react';
import leadsAPI from '../lib/leadsAPI';

export default function LeadsOverview() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: [], bySource: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'novo',
    source: 'site'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, statsData] = await Promise.all([
        leadsAPI.getAll(),
        leadsAPI.getStats()
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await leadsAPI.update(editingLead.id, formData);
        setMessage({ type: 'success', text: 'Lead atualizado com sucesso!' });
      } else {
        await leadsAPI.create(formData);
        setMessage({ type: 'success', text: 'Lead criado com sucesso!' });
      }
      setFormData({ name: '', email: '', phone: '', company: '', status: 'novo', source: 'site' });
      setShowForm(false);
      setEditingLead(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (lead) => {
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status,
      source: lead.source || 'site'
    });
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este lead?');
    if (confirmed) {
      try {
        await leadsAPI.delete(id);
        setMessage({ type: 'success', text: 'Lead excluído com sucesso!' });
        loadData();
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      }
    }
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

  // Calcular métricas do Overview
  const calculateOverviewMetrics = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const total = leads.length;
    const newThisWeek = leads.filter(l => new Date(l.created_at) > weekAgo).length;
    
    const gained = leads.filter(l => l.status === 'ganho').length;
    const lost = leads.filter(l => l.status === 'perdido').length;
    
    const conversionRate = total > 0 ? ((gained / total) * 100).toFixed(1) : 0;
    
    // Simular receita prevista (em produção viria do backend)
    const predictedRevenue = gained * 15000; // R$ 15.000 médio
    const averageTicket = gained > 0 ? predictedRevenue / gained : 0;

    // Leads recentes (últimos 5)
    const recentLeads = [...leads]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    return {
      total,
      newThisWeek,
      conversionRate,
      gained,
      lost,
      predictedRevenue,
      averageTicket,
      recentLeads
    };
  };

  const metrics = calculateOverviewMetrics();

  if (loading) {
    return <div className="loading">Carregando Visão Geral...</div>;
  }

  return (
    <div className="overview-container">
      {/* Mensagens */}
      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}
      
      {/* KPIs Principais - Overview */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{metrics.total}</div>
          <div className="kpi-label">Total de Leads</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">+{metrics.newThisWeek}</div>
          <div className="kpi-label">Novos (7 dias)</div>
          <div className="kpi-change positive">Esta semana</div>
        </div>
        
        <div className="kpi-card warning">
          <div className="kpi-value">{metrics.conversionRate}%</div>
          <div className="kpi-label">Taxa de Conversão</div>
        </div>
        
        <div className="kpi-card success">
          <div className="kpi-value">{metrics.gained}</div>
          <div className="kpi-label">Leads Ganhos</div>
        </div>
        
        <div className="kpi-card danger">
          <div className="kpi-value">{metrics.lost}</div>
          <div className="kpi-label">Leads Perdidos</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">R$ {metrics.predictedRevenue.toLocaleString('pt-BR')}</div>
          <div className="kpi-label">Receita Prevista</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-value">R$ {metrics.averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
          <div className="kpi-label">Ticket Médio</div>
        </div>
      </div>

      {/* Botão adicionar */}
      <button 
        className="btn-primary" 
        onClick={() => { 
          setShowForm(!showForm); 
          setEditingLead(null); 
          setFormData({ name: '', email: '', phone: '', company: '', status: 'novo', source: 'site' }); 
        }}
        style={{ marginBottom: '20px' }}
      >
        {showForm ? '✕ Cancelar' : '+ Novo Lead'}
      </button>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="lead-form">
          <h3>{editingLead ? 'Editar Lead' : 'Novo Lead'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Empresa</label>
              <input
                type="text"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="novo">Novo</option>
                <option value="contactado">Contactado</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta">Proposta</option>
                <option value="ganho">Ganho</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
            <div className="form-group">
              <label>Origem</label>
              <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                <option value="site">Site</option>
                <option value="google">Google</option>
                <option value="indicacao">Indicação</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingLead ? 'Atualizar' : 'Criar'} Lead
            </button>
          </div>
        </form>
      )}

      {/* Leads Recentes */}
      <div className="section">
        <h3>Leads Recentes</h3>
        {metrics.recentLeads.length === 0 ? (
          <p className="no-data">Nenhum lead encontrado</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Empresa</th>
                <th>Status</th>
                <th>Origem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email || '-'}</td>
                  <td>{lead.phone || '-'}</td>
                  <td>{lead.company || '-'}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(lead.status) }}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.source || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(lead)} className="btn-small">Editar</button>
                    <button onClick={() => handleDelete(lead.id)} className="btn-small btn-danger">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Distribuição por Status */}
      <div className="section">
        <h3>Distribuição por Status</h3>
        <div className="status-grid">
          {stats.byStatus?.map((s) => {
            const percentage = stats.total > 0 ? (s.count / stats.total * 100).toFixed(1) : 0;
            return (
              <div key={s.status} className="status-card" style={{ borderLeftColor: getStatusColor(s.status) }}>
                <div className="status-name">{s.status}</div>
                <div className="status-count">{s.count} leads ({percentage}%)</div>
                <div className="status-bar">
                  <div 
                    className="status-fill" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getStatusColor(s.status)
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

