//api de comunicação com o backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  if (typeof window !== 'undefined') {
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
    
    console.log('[targetsAPI] Headers - token exists:', !!token);
    
    //  MULTI-TENANT 100% FROM JWT - NO x-tenant-id header needed
    // O backend extrai o tenantId diretamente do token JWT
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  return { 'Content-Type': 'application/json' };
};

// Função helper robusta para verificar resposta
const handleResponse = async (response) => {
  // Verificar status primeiro
  if (!response.ok) {
    let errorMessage = `Erro HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch (e2) {}
    }
    throw new Error(errorMessage);
  }
  
  // Verificar se há conteúdo
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    return { success: true, data: null };
  }
  
  // Verificar se é JSON válido
  try {
    const data = JSON.parse(text);
    if (!data.success && data.success !== undefined) {
      throw new Error(data.error || 'Erro na operação');
    }
    return data;
  } catch (e) {
    console.error('[targetsAPI] Resposta inválida:', text.substring(0, 200));
    throw new Error('Resposta inválida do servidor');
  }
};

// ========== TARGETS API ==========

// Buscar metas do ano atual
export const getTargets = async () => {
  try {
    const response = await fetch(`${API_URL}/api/targets`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getTargets error:', err);
    throw err;
  }
};

// Buscar metas de um ano específico
export const getTargetsByYear = async (year) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/${year}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getTargetsByYear error:', err);
    throw err;
  }
};

// Criar ou atualizar meta
export const createTarget = async ({ month, year, target_value }) => {
  try {
    const response = await fetch(`${API_URL}/api/targets`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ month, year, target_value })
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] createTarget error:', err);
    throw err;
  }
};

// ========== ACTIVITIES API ==========

// Listar todas as atividades
export const getAllActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getAllActivities error:', err);
    throw err;
  }
};

// Listar atividades atrasadas
export const getOverdueActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/overdue`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getOverdueActivities error:', err);
    throw err;
  }
};

// Listar próximas atividades
export const getUpcomingActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/upcoming`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getUpcomingActivities error:', err);
    throw err;
  }
};

// Listar leads inativos (sem atividade há X dias)
export const getInactiveLeads = async (days = 7) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/inactive/${days}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getInactiveLeads error:', err);
    throw err;
  }
};

// Estatísticas de atividades
export const getActivityStats = async () => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/stats`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] getActivityStats error:', err);
    throw err;
  }
};

// Listar atividades de um lead específico
export const getLeadActivities = async (leadId) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/lead/${leadId}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data || [];
  } catch (err) {
    console.error('[targetsAPI] getLeadActivities error:', err);
    throw err;
  }
};

// Criar atividade
export const createActivity = async ({ lead_id, type, description, due_date }) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ lead_id, type, description, due_date })
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] createActivity error:', err);
    throw err;
  }
};

// Marcar atividade como completa
export const completeActivity = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/${id}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] completeActivity error:', err);
    throw err;
  }
};

// Atualizar atividade
export const updateActivity = async (id, { type, description, due_date, completed }) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ type, description, due_date, completed })
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] updateActivity error:', err);
    throw err;
  }
};

// Deletar atividade
export const deleteActivity = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/targets/activities/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    return data.data;
  } catch (err) {
    console.error('[targetsAPI] deleteActivity error:', err);
    throw err;
  }
};

export default {
  // Targets
  getTargets,
  getTargetsByYear,
  createTarget,
  // Activities
  getAllActivities,
  getOverdueActivities,
  getUpcomingActivities,
  getInactiveLeads,
  getActivityStats,
  getLeadActivities,
  createActivity,
  completeActivity,
  updateActivity,
  deleteActivity
};

