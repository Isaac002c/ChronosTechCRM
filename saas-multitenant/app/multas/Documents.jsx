'use client';

import { useState, useEffect } from 'react';
import { 
  getDocuments, 
  createDocument, 
  deleteDocument,
  getDocumentStats 
} from '../lib/documentsAPI';
import { getContracts } from '../lib/contractsAPI';
import { getClients } from '../lib/clientsAPI';

export default function MultasDocuments() {
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    contract_id: ''
  });

  const [formData, setFormData] = useState({
    contract_id: '',
    client_id: '',
    file_url: '',
    file_name: '',
    file_type: '',
    file_size: '',
    category: 'outros',
    description: ''
  });

  // Estado para arquivo selecionado
  const [selectedFile, setSelectedFile] = useState(null);

  // Categorias de documentos
  const categories = [
    { value: 'contrato', label: 'Contrato' },
    { value: 'documento', label: 'Documento' },
    { value: 'foto', label: 'Foto' },
    { value: 'certidao', label: 'Certidão' },
    { value: 'outros', label: 'Outros' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [documentsData, contractsData, clientsData, statsData] = await Promise.all([
        getDocuments(filters),
        getContracts(),
        getClients(),
        getDocumentStats()
      ]);
      setDocuments(documentsData);
      setContracts(contractsData);
      setClients(clientsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    loadData();
  };

  // Função para converter arquivo para base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData({
        ...formData,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size.toString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Converter strings vazias para null para campos UUID
      const finalFormData = {
        contract_id: formData.contract_id || null,
        client_id: formData.client_id || null,
        file_url: formData.file_url || null,
        file_name: formData.file_name || null,
        file_type: formData.file_type || null,
        file_size: formData.file_size ? parseInt(formData.file_size) : null,
        category: formData.category || 'outros',
        description: formData.description || null
      };

      // Se há arquivo selecionado, converter para base64
      if (selectedFile) {
        const base64 = await convertToBase64(selectedFile);
        finalFormData.file_url = base64;
      }

      await createDocument(finalFormData);
      setShowModal(false);
      setSelectedFile(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await deleteDocument(id);
        loadData();
      } catch (err) {
        console.error('Erro ao deletar documento:', err);
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      contract_id: '',
      client_id: '',
      file_url: '',
      file_name: '',
      file_type: '',
      file_size: '',
      category: 'outros',
      description: ''
    });
    setSelectedFile(null);
  };

  const getCategoryLabel = (value) => {
    const category = categories.find(c => c.value === value);
    return category ? category.label : value;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando documentos...</p>
      </div>
    );
  }

  return (
    <div className="multas-documents">
      {/* Estatísticas */}
      {stats && (
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Total de Documentos</span>
            <span className="stat-value">{stats.total || 0}</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Categoria</label>
          <select 
            value={filters.category} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Contrato</label>
          <select 
            value={filters.contract_id} 
            onChange={(e) => handleFilterChange('contract_id', e.target.value)}
          >
            <option value="">Todos</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.contract_number || contract.id}
              </option>
            ))}
          </select>
        </div>
        <button onClick={applyFilters} className="btn-filter">
          Filtrar
        </button>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Novo Documento
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>[X]</button>
        </div>
      )}

      {/* Tabela de Documentos */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Categoria</th>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Tamanho</th>
              <th>Upload</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Nenhum documento encontrado
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="file-info">
                      <span className="file-icon">[Doc]</span>
                      <span className="file-name">{doc.file_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {getCategoryLabel(doc.category)}
                    </span>
                  </td>
                  <td>{doc.contract_number || '-'}</td>
                  <td>{doc.client_name || '-'}</td>
                  <td>{formatFileSize(doc.file_size)}</td>
                  <td>{formatDate(doc.uploaded_at)}</td>
                  <td className="actions-cell">
                    {doc.file_url && (
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="Visualizar"
                      >
                        [Ver]
                      </a>
                    )}
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="btn-icon danger"
                      title="Excluir"
                    >
                      [X]
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Documento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Documento</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">[X]</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Contrato</label>
                  <select
                    value={formData.contract_id}
                    onChange={(e) => setFormData({...formData, contract_id: e.target.value})}
                  >
                    <option value="">Selecione um contrato</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contract_number || contract.id} - {contract.client_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Upload de arquivo do computador */}
              <div className="form-group">
                <label>Selecionar Arquivo do Computador</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                />
                {selectedFile && (
                  <div className="file-selected" style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #22c55e',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span>[Doc]</span>
                    <span>{selectedFile.name}</span>
                    <span style={{color: '#666', fontSize: '12px'}}>
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Campo de URL alternativa */}
              <div className="form-group">
                <label>Ou URL Externa (se não usar upload)</label>
                <input
                  type="url"
                  value={selectedFile ? '' : formData.file_url}
                  onChange={(e) => {
                    setSelectedFile(null);
                    setFormData({...formData, file_url: e.target.value});
                  }}
                  placeholder="https://..."
                  disabled={!!selectedFile}
                />
              </div>
              
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); setSelectedFile(null); }} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
