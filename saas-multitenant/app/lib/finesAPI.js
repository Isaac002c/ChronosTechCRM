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
// FINES API - Multas V2
// ============================================

// Listar todas as multas
export const getFines = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/fines?${params}` : '/fines';
  const data = await fetchAPI(endpoint);
  return data.data;
};

// Buscar multa por ID
export const getFineById = async (id) => {
  const data = await fetchAPI(`/fines/${id}`);
  return data.data;
};

// Buscar multas por cliente
export const getFinesByClient = async (clientId) => {
  const data = await fetchAPI(`/fines/client/${clientId}`);
  return data.data;
};

// Buscar multas por vendedor
export const getFinesBySeller = async (sellerId) => {
  const data = await fetchAPI(`/fines/seller/${sellerId}`);
  return data.data;
};

// Estatísticas de multas
export const getFineStats = async () => {
  const data = await fetchAPI('/fines/stats');
  return data.data;
};

// Dashboard de multas
export const getFineDashboard = async () => {
  const data = await fetchAPI('/fines/dashboard');
  return data.data;
};

// Alertas de multas
export const getFineAlerts = async () => {
  const data = await fetchAPI('/fines/alerts');
  return data.data;
};

// Multas urgentes
export const getUrgentFines = async (days = 5) => {
  const data = await fetchAPI(`/fines/urgent?days=${days}`);
  return data.data;
};

// Multas aguardando documento
export const getFinesWaitingDocument = async () => {
  const data = await fetchAPI('/fines/waiting-document');
  return data.data;
};

// Multas aguardando protocolo
export const getFinesWaitingProtocol = async () => {
  const data = await fetchAPI('/fines/waiting-protocol');
  return data.data;
};

// Multas vencidas
export const getOverdueFines = async () => {
  const data = await fetchAPI('/fines/overdue');
  return data.data;
};

// Multas por órgão
export const getFinesByOrgan = async () => {
  const data = await fetchAPI('/fines/by-organ');
  return data.data;
};

// Multas por vendedor
export const getFinesBySellerGrouped = async () => {
  const data = await fetchAPI('/fines/by-seller');
  return data.data;
};

// Taxa de deferimento
export const getDefermentRate = async () => {
  const data = await fetchAPI('/fines/deferment-rate');
  return data.data;
};

// Criar multa
export const createFine = async (fineData) => {
  const data = await fetchAPI('/fines', {
    method: 'POST',
    body: JSON.stringify(fineData),
  });
  return data.data;
};

// Atualizar multa
export const updateFine = async (id, fineData) => {
  const data = await fetchAPI(`/fines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fineData),
  });
  return data.data;
};

// Atualizar status da multa
export const updateFineStatus = async (id, status) => {
  const data = await fetchAPI(`/fines/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.data;
};

// Atualizar estágio da multa
export const updateFineStage = async (id, stage) => {
  const data = await fetchAPI(`/fines/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  });
  return data.data;
};

// Deletar multa
export const deleteFine = async (id) => {
  const data = await fetchAPI(`/fines/${id}`, {
    method: 'DELETE',
  });
  return data.data;
};

// ============================================
// DOCUMENTOS DAS MULTAS
// ============================================

// Listar documentos de uma multa
export const getFineDocuments = async (fineId, category = null) => {
  const params = category ? `?category=${category}` : '';
  const data = await fetchAPI(`/fines/${fineId}/documents${params}`);
  return data.data;
};

// Adicionar documento
export const addFineDocument = async (fineId, documentData) => {
  const data = await fetchAPI(`/fines/${fineId}/documents`, {
    method: 'POST',
    body: JSON.stringify(documentData),
  });
  return data.data;
};

// Deletar documento
export const deleteFineDocument = async (fineId, documentId) => {
  const data = await fetchAPI(`/fines/${fineId}/documents/${documentId}`, {
    method: 'DELETE',
  });
  return data.data;
};

// ============================================
// LOGS DAS MULTAS
// ============================================

// Listar logs de uma multa
export const getFineLogs = async (fineId) => {
  const data = await fetchAPI(`/fines/${fineId}/logs`);
  return data.data;
};

// Listar todos os logs
export const getAllFineLogs = async (limit = 100, offset = 0) => {
  const data = await fetchAPI(`/fines/logs/all?limit=${limit}&offset=${offset}`);
  return data.data;
};

// ============================================
// CONSTANTES
// ============================================

export const FINE_STATUS = {
  PENDENTE: 'pendente',
  AGUARDANDO_DOCUMENTO: 'aguardando_documento',
  PROTOCOLADO: 'protocolado',
  DEFERIDO: 'deferido',
  INDEFERIDO: 'indeferido',
  CANCELADO: 'cancelado'
};

export const FINE_STAGE = {
  CADASTRO: 'cadastro',
  DEFESA_PREVIA: 'defesa_previa',
  RECURSO_1: 'recurso_1',
  RECURSO_2: 'recurso_2',
  FINALIZADO: 'finalizado'
};

export const FINE_STAGE_LABELS = {
  cadastro: 'Cadastro',
  defesa_previa: 'Defesa Prévia',
  recurso_1: 'Recurso 1ª Instância',
  recurso_2: 'Recurso 2ª Instância',
  finalizado: 'Finalizado'
};

export const FINE_STATUS_LABELS = {
  pendente: 'Pendente',
  aguardando_documento: 'Aguardando Documento',
  protocolado: 'Protocolado',
  deferido: 'Deferido',
  indeferido: 'Indeferido',
  cancelado: 'Cancelado'
};

export const DOCUMENT_CATEGORIES = {
  DEFESA: 'defesa',
  RECURSO: 'recurso',
  COMPROVANTE: 'comprovante',
  OUTRO: 'outro'
};

