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
// CLIENTS API
// ============================================

// Listar todos os clientes
export const getClients = async () => {
  const data = await fetchAPI('/clients');
  return data.data;
};

// Buscar cliente por ID
export const getClientById = async (id) => {
  const data = await fetchAPI(`/clients/${id}`);
  return data.data;
};

// Pesquisar clientes
export const searchClients = async (query) => {
  const data = await fetchAPI(`/clients/search?q=${encodeURIComponent(query)}`);
  return data.data;
};

// Estatísticas de clientes
export const getClientStats = async () => {
  const data = await fetchAPI('/clients/stats');
  return data.data;
};

// Criar cliente
export const createClient = async (clientData) => {
  const data = await fetchAPI('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  return data.data;
};

// Atualizar cliente
export const updateClient = async (id, clientData) => {
  const data = await fetchAPI(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
  return data.data;
};

// Deletar cliente
export const deleteClient = async (id) => {
  const data = await fetchAPI(`/clients/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

