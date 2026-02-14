// API de comunicação com o backend Express

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Função para obter headers de autenticação
const getAuthHeaders = () => {
  // Pegar token dos cookies
  const cookies = document.cookie.split(';');
  let token = '';
  let tenantId = '';
  
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth-token') token = value;
    if (name === 'tenant-id') tenantId = value;
  });

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId
  };
};

export const leadsAPI = {
  // GET /api/leads - Listar todos os leads
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erro ao buscar leads');
    }
    
    return data.data || [];
  },

  // GET /api/leads/stats - Métricas
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/leads/stats`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erro ao buscar estatísticas');
    }
    
    return data.data || { total: 0, byStatus: [], bySource: [] };
  },

  // GET /api/leads/:id - Buscar lead por ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar lead');
    }
    
    return data.data;
  },

  // POST /api/leads - Criar novo lead
  create: async (leadData) => {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(leadData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar lead');
    }
    
    return data.data;
  },

  // PUT /api/leads/:id - Atualizar lead
  update: async (id, leadData) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(leadData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar lead');
    }
    
    return data.data;
  },

  // DELETE /api/leads/:id - Deletar lead
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao deletar lead');
    }
    
    return data.data;
  }
};

export default leadsAPI;

