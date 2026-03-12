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
// CONTRACTS API
// ============================================

// Listar todos os contratos
export const getContracts = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/contracts?${params}` : '/contracts';
  const data = await fetchAPI(endpoint);
  return data.data;
};

// Buscar contrato por ID
export const getContractById = async (id) => {
  const data = await fetchAPI(`/contracts/${id}`);
  return data.data;
};

// Buscar contratos por cliente
export const getContractsByClient = async (clientId) => {
  const data = await fetchAPI(`/contracts/client/${clientId}`);
  return data.data;
};

// Buscar contratos por serviço
export const getContractsByService = async (serviceId) => {
  const data = await fetchAPI(`/contracts/service/${serviceId}`);
  return data.data;
};

// Estatísticas de contratos
export const getContractStats = async () => {
  const data = await fetchAPI('/contracts/stats');
  return data.data;
};

// Dashboard de contratos
export const getContractDashboard = async () => {
  const data = await fetchAPI('/contracts/dashboard');
  return data.data;
};

// Contratos por órgão (para gráficos)
export const getContractsByOrgan = async () => {
  const data = await fetchAPI('/contracts/by-organ');
  return data.data;
};

// Alertas de contratos
export const getContractAlerts = async () => {
  const data = await fetchAPI('/contracts/alerts');
  return data.data;
};

// Contratos próximos ao vencimento
export const getContractsNearDue = async (days = 30) => {
  const data = await fetchAPI(`/contracts/near-due?days=${days}`);
  return data.data;
};

// Contratos vencidos
export const getOverdueContracts = async () => {
  const data = await fetchAPI('/contracts/overdue');
  return data.data;
};

// Criar contrato
export const createContract = async (contractData) => {
  const data = await fetchAPI('/contracts', {
    method: 'POST',
    body: JSON.stringify(contractData),
  });
  return data.data;
};

// Atualizar contrato
export const updateContract = async (id, contractData) => {
  const data = await fetchAPI(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(contractData),
  });
  return data.data;
};

// Atualizar status do contrato
export const updateContractStatus = async (id, status) => {
  const data = await fetchAPI(`/contracts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.data;
};

// Deletar contrato
export const deleteContract = async (id) => {
  const data = await fetchAPI(`/contracts/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

