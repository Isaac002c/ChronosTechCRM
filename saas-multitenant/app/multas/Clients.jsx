'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, createClient, updateClient, deleteClient, searchClients } from '../lib/clientsAPI';

export default function MultasClients() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    cpf: '',
    cnh: '',
    first_cnh: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length >= 2) {
      try {
        const results = await searchClients(term);
        setClients(results);
      } catch (err) {
        console.error('Erro na pesquisa:', err);
      }
    } else if (term.length === 0) {
      loadClients();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError(err.message);
    }
  };

  const handleViewClient = (client) => {
    // Navegar para a página de detalhes do cliente
    router.push(`/multas/clients/${client.id}`);
  };

  const handleEdit = (e, client) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      birth_date: client.birth_date || '',
      cpf: client.cpf || '',
      cnh: client.cnh || '',
      first_cnh: client.first_cnh || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteClient(id);
        loadClients();
      } catch (err) {
        console.error('Erro ao deletar cliente:', err);
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birth_date: '',
      cpf: '',
      cnh: '',
      first_cnh: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  const openNewClientModal = () => {
    setEditingClient(null);
    resetForm();
    setShowModal(true);
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="multas-clients">
      {/* Barra de Ações */}
      <div className="actions-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <button onClick={openNewClientModal} className="btn-primary">
          + Novo Cliente
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Tabela de Clientes - Clicáveis */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>CNH</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr 
                  key={client.id} 
                  onClick={() => handleViewClient(client)}
                  className="clickable-row"
                >
                  <td>{client.name}</td>
                  <td>{formatCPF(client.cpf)}</td>
                  <td>{client.cnh || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleEdit(e, client)}
                      className="btn-icon"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, client.id)}
                      className="btn-icon danger"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cliente */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">[X]</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    maxLength={14}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CNH</label>
                  <input
                    type="text"
                    value={formData.cnh}
                    onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Primeira CNH</label>
                  <input
                    type="date"
                    value={formData.first_cnh}
                    onChange={(e) => setFormData({...formData, first_cnh: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingClient ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

