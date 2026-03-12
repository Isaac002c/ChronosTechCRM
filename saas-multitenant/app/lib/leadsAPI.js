// API de comunicação com o backend Express

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Função para obter headers de autenticação
const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  
  // Pegar token - suporta múltiplos formatos
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
};

// Função para obter informações do usuário logado (inclui role)
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    return data;
  } catch (err) {
    console.error('[leadsAPI] getCurrentUser error:', err);
    throw err;
  }
};

export const leadsAPI = {
  // GET /api/leads - Listar todos os leads
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        headers: getAuthHeaders(),
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
      console.error('[leadsAPI] getAll error:', err);
      throw err;
    }
  },

  // GET /api/leads/stats - Métricas
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/stats`, {
        headers: getAuthHeaders(),
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
        return { total: 0, byStatus: [], bySource: [] };
      }
      
      const data = JSON.parse(text);
      return data.data || { total: 0, byStatus: [], bySource: [] };
    } catch (err) {
      console.error('[leadsAPI] getStats error:', err);
      throw err;
    }
  },

  // GET /api/leads/pipeline - Métricas financeiras do pipeline
  getPipelineMetrics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/pipeline`, {
        headers: getAuthHeaders(),
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
        return null;
      }
      
      const data = JSON.parse(text);
      return data.data;
    } catch (err) {
      console.error('[leadsAPI] getPipelineMetrics error:', err);
      throw err;
    }
  },

  // GET /api/leads/monthly - Métricas mensais (histórico)
  getMonthlyMetrics: async (months = 12) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/monthly?months=${months}`, {
        headers: getAuthHeaders(),
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
      console.error('[leadsAPI] getMonthlyMetrics error:', err);
      throw err;
    }
  },

  // GET /api/leads/inactive/:days - Leads inativos
  getInactiveLeads: async (days = 7) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/inactive/${days}`, {
        headers: getAuthHeaders(),
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
        return [];
      }
      
      const data = JSON.parse(text);
      return data.data || [];
    } catch (err) {
      console.error('[leadsAPI] getInactiveLeads error:', err);
      return []; // Retorna array vazio em vez de erro
    }
  },

  // GET /api/leads/:id - Buscar lead por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
        headers: getAuthHeaders(),
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
        return null;
      }
      
      const data = JSON.parse(text);
      return data.data;
    } catch (err) {
      console.error('[leadsAPI] getById error:', err);
      throw err;
    }
  },

  // POST /api/leads - Criar novo lead
  create: async (leadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(leadData)
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
      console.error('[leadsAPI] create error:', err);
      throw err;
    }
  },

  // PUT /api/leads/:id - Atualizar lead
  update: async (id, leadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(leadData)
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
      console.error('[leadsAPI] update error:', err);
      throw err;
    }
  },

  // DELETE /api/leads/:id - Deletar lead
  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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
        return null;
      }
      
      const data = JSON.parse(text);
      return data.data;
    } catch (err) {
      console.error('[leadsAPI] delete error:', err);
      throw err;
    }
  }
};

export default leadsAPI;

