const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

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

// Get all services
export const getAllServices = async () => {
  const data = await fetchAPI('/services');
  return data.data;
};

// Get services by client
export const getServicesByClient = async (clientId) => {
  const data = await fetchAPI(`/services/client/${clientId}`);
  return data.data;
};

// Create service
export const createService = async (serviceData) => {
  const data = await fetchAPI('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
  return data.data;
};

// Delete service
export const deleteService = async (serviceId) => {
  const data = await fetchAPI(`/services/${serviceId}`, {
    method: 'DELETE',
  });
  return data.data;
};

// Update service
export const updateService = async (serviceId, serviceData) => {
  const data = await fetchAPI(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  });
  return data.data;
};

