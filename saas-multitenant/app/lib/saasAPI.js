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
// PLANS API
// ============================================

// Listar todos os planos disponíveis
export const getPlans = async () => {
  const data = await fetchAPI('/plans');
  return data.data;
};

// ============================================
// SUBSCRIPTION API
// ============================================

// Buscar assinatura atual
export const getSubscription = async () => {
  const data = await fetchAPI('/subscription');
  return data.data;
};

// Verificar limites do plano
export const checkPlanLimits = async (resource, count) => {
  const data = await fetchAPI(`/subscription/limits/${resource}?count=${count}`);
  return data.data;
};

// ============================================
// ACTIVITY LOGS API
// ============================================

// Listar logs de atividades
export const getActivityLogs = async (page = 1, limit = 50) => {
  const data = await fetchAPI(`/activity?page=${page}&limit=${limit}`);
  return data.data;
};

// Estatísticas de atividades
export const getActivityStats = async (days = 30) => {
  const data = await fetchAPI(`/activity/stats?days=${days}`);
  return data.data;
};

// Logs de uma entidade específica
export const getEntityActivity = async (entityType, entityId) => {
  const data = await fetchAPI(`/activity/entity/${entityType}/${entityId}`);
  return data.data;
};

// ============================================
// ADMIN API - Empresas (apenas admin)
// ============================================

// Listar todas as empresas
export const getTenants = async (page = 1, limit = 20) => {
  const data = await fetchAPI(`/admin/tenants?page=${page}&limit=${limit}`);
  return data.data;
};

// Detalhes de uma empresa
export const getTenantDetails = async (id) => {
  const data = await fetchAPI(`/admin/tenants/${id}`);
  return data.data;
};

// Criar nova empresa
export const createTenant = async (tenantData) => {
  const data = await fetchAPI('/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(tenantData),
  });
  return data.data;
};

// Atualizar status da empresa
export const updateTenantStatus = async (id, isActive) => {
  const data = await fetchAPI(`/admin/tenants/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
  return data.data;
};

