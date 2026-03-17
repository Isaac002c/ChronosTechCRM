// API de comunicação com o backend Express - Forecast

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  
  let token = localStorage.getItem('token') || localStorage.getItem('auth-token') || '';
  
  if (!token && document.cookie) {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    token = cookies['auth-token'] || cookies['token'] || '';
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async (response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = `Erro HTTP: ${response.status}`;
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
  
  if (!text || text.trim() === '') {
    return null;
  }
  
  const data = JSON.parse(text);
  return data;
};

export const forecastAPI = {
  // GET /api/forecast/config - Buscar configuração
  getConfig: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast/config`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await handleResponse(response);
      return data.data || [];
    } catch (err) {
      console.error('[forecastAPI] getConfig error:', err);
      throw err;
    }
  },

  // PUT /api/forecast/config - Atualizar configuração
  updateConfig: async (probabilities) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ probabilities })
      });
      const data = await handleResponse(response);
      return data;
    } catch (err) {
      console.error('[forecastAPI] updateConfig error:', err);
      throw err;
    }
  },

  // POST /api/forecast/config/reset - Resetar para padrão
  resetConfig: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast/config/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await handleResponse(response);
      return data;
    } catch (err) {
      console.error('[forecastAPI] resetConfig error:', err);
      throw err;
    }
  },

  // GET /api/forecast/calculate - Calcular forecast
  calculate: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast/calculate`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await handleResponse(response);
      return data.data || null;
    } catch (err) {
      console.error('[forecastAPI] calculate error:', err);
      throw err;
    }
  }
};

export default forecastAPI;

