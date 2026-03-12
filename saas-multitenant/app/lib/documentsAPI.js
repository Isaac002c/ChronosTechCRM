const API_URL = 'http://localhost:5000/api';

// Helper para obter o token
const getToken = () => {
  if (typeof document !== 'undefined') {
    // Primeiro tenta localStorage (onde o login salva)
    const localToken = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (localToken) return localToken;
    
    // Depois tenta cookie (suporta ambos os nomes)
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('auth-token=') || row.startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }
  return null;
};

// Helper para requisições
const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  
  return data;
};

// ============================================
// DOCUMENTS API
// ============================================

// Listar todos os documentos
export const getDocuments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/documents?${params}` : '/documents';
  const data = await fetchAPI(endpoint);
  return data.data;
};

// Buscar documento por ID
export const getDocumentById = async (id) => {
  const data = await fetchAPI(`/documents/${id}`);
  return data.data;
};

// Buscar documentos por contrato
export const getDocumentsByContract = async (contractId) => {
  const data = await fetchAPI(`/documents/contract/${contractId}`);
  return data.data;
};

// Buscar documentos por cliente
export const getDocumentsByClient = async (clientId) => {
  const data = await fetchAPI(`/documents/client/${clientId}`);
  return data.data;
};

// Estatísticas de documentos
export const getDocumentStats = async () => {
  const data = await fetchAPI('/documents/stats');
  return data.data;
};

// Criar documento
export const createDocument = async (documentData) => {
  const data = await fetchAPI('/documents', {
    method: 'POST',
    body: JSON.stringify(documentData),
  });
  return data.data;
};

// Atualizar documento
export const updateDocument = async (id, documentData) => {
  const data = await fetchAPI(`/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  });
  return data.data;
};

// Deletar documento
export const deleteDocument = async (id) => {
  const data = await fetchAPI(`/documents/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

