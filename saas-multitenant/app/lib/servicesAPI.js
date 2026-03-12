const API_URL = 'http://localhost:5000/api';

// Helper para obter o token
const getToken = () => {
  if (typeof document !== 'undefined') {
    const localToken = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (localToken) return localToken;
    
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
// SERVICES API
// ============================================

// Listar todos os serviços
export const getServices = async () => {
  const data = await fetchAPI('/services');
  return data.data;
};

// Listar serviços por cliente
export const getServicesByClient = async (clientId) => {
  const data = await fetchAPI(`/services/client/${clientId}`);
  return data.data;
};

// Buscar serviço por ID
export const getServiceById = async (id) => {
  const data = await fetchAPI(`/services/${id}`);
  return data.data;
};

// Criar serviço
export const createService = async (serviceData) => {
  const data = await fetchAPI('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
  return data.data;
};

// Atualizar serviço
export const updateService = async (id, serviceData) => {
  const data = await fetchAPI(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  });
  return data.data;
};

// Deletar serviço
export const deleteService = async (id) => {
  const data = await fetchAPI(`/services/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

