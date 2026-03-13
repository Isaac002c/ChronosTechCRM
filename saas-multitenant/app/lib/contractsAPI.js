const API_URL = 'http://localhost:5000/api';

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

// Functions used in client detail
export const getContractsByService = async (serviceId) => {
  const data = await fetchAPI(`/contracts/service/${serviceId}`);
  return data.data;
};

export const createContract = async (contractData) => {
  const data = await fetchAPI('/contracts', {
    method: 'POST',
    body: JSON.stringify(contractData),
  });
  return data.data;
};

export const updateContract = async (id, contractData) => {
  const data = await fetchAPI(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(contractData),
  });
  return data.data;
};

export const deleteContract = async (id) => {
  const data = await fetchAPI(`/contracts/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

// Backward compatibility for other pages (Dashboard, Documents)
export const getContracts = async () => {
  return [];
};

export const getContractDashboard = async () => {
  return {};
};

export const getContractsByOrgan = async () => {
  return [];
};

export const getContractAlerts = async () => {
  return [];
};

export const getContractsNearDue = async () => {
  return [];
};

export const getOverdueContracts = async () => {
  return [];
};

export const getContractStats = async () => {
  return { total: 0 };
};

