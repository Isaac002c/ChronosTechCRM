const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  if (typeof window !== 'undefined') {
    // Pegar token do localStorage
    let token = localStorage.getItem('token') || localStorage.getItem('auth-token') || '';
    
    // Se não encontrou nos formatos comuns, tenta pegar do cookie
    if (!token && document.cookie) {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['auth-token'] || cookies['token'] || '';
    }
    
    // 🚀 MULTI-TENANT 100% FROM JWT - NO x-tenant-id header needed
    // O backend extrai o tenantId diretamente do token JWT
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  return { 'Content-Type': 'application/json' };
};

// ========== SELLERS API ==========

// Buscar todos os vendedores
export const getSellers = async () => {
  try {
    const headers = getHeaders();
    
    const response = await fetch(`${API_URL}/api/sellers`, {
      headers,
      credentials: 'include'
    });
    
    // ✅ CORREÇÃO: Ler o body apenas uma vez
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
      return [];
    }
    
    const data = JSON.parse(text);
    return data.data || [];
  } catch (err) {
    console.error('[sellersAPI] getSellers error:', err);
    throw err;
  }
};

// Buscar vendedores com métricas (para Performance)
export const getSellersWithMetrics = async () => {
  try {
    const headers = getHeaders();
    
    const response = await fetch(`${API_URL}/api/sellers/metrics`, {
      headers,
      credentials: 'include'
    });
    
    // ✅ CORREÇÃO: Ler o body apenas uma vez
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
      return [];
    }
    
    const data = JSON.parse(text);
    return data.data || [];
  } catch (err) {
    console.error('[sellersAPI] getSellersWithMetrics error:', err);
    throw err;
  }
};

// Buscar vendedor por ID
export const getSellerById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/sellers/${id}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    
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
    return data.data;
  } catch (err) {
    console.error('[sellersAPI] getSellerById error:', err);
    throw err;
  }
};

// Criar vendedor
export const createSeller = async ({ name, email, avatar, monthly_target }) => {
  try {
    const headers = getHeaders();
    
    const response = await fetch(`${API_URL}/api/sellers`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name, email, avatar, monthly_target })
    });
    
    // ✅ CORREÇÃO: Ler o body apenas uma vez
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
    return data.data;
  } catch (err) {
    console.error('[sellersAPI] createSeller error:', err);
    throw err;
  }
};

// Atualizar vendedor
export const updateSeller = async (id, { name, email, avatar, monthly_target, active }) => {
  try {
    const response = await fetch(`${API_URL}/api/sellers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, email, avatar, monthly_target, active })
    });
    
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
    return data.data;
  } catch (err) {
    console.error('[sellersAPI] updateSeller error:', err);
    throw err;
  }
};

// Deletar vendedor
export const deleteSeller = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/sellers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    
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
    return data.data;
  } catch (err) {
    console.error('[sellersAPI] deleteSeller error:', err);
    throw err;
  }
};

export default {
  getSellers,
  getSellersWithMetrics,
  getSellerById,
  createSeller,
  updateSeller,
  deleteSeller
};

