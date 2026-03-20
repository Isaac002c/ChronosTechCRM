// lib/usersAPI.js - API para gerenciamento de usuários

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

// Helper para obter o token do cookie
const getToken = () => {
  if (typeof window !== 'undefined') {
    // Primeiro tenta localStorage (onde o login salva)
    const localToken = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (localToken) return localToken;
    
    // Depois tenta cookie (suporta ambos os nomes)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' || name === 'auth-token') {
        return value;
      }
    }
  }
  return null;
};

const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
};

// GET - Listar usuários
export const getUsers = async () => {
  return fetchAPI('/api/users/management');
};

// GET - Estatísticas de usuários
export const getUsersStats = async () => {
  return fetchAPI('/api/users/management/stats');
};

// GET - Listar roles disponíveis
export const getRoles = async () => {
  return fetchAPI('/api/users/management/roles');
};

// GET - Buscar usuário por ID
export const getUserById = async (id) => {
  return fetchAPI(`/api/users/management/${id}`);
};

// POST - Criar usuário
export const createUser = async (userData) => {
  return fetchAPI('/api/users/management', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// PUT - Atualizar usuário
export const updateUser = async (id, userData) => {
  return fetchAPI(`/api/users/management/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

// PATCH - Alterar senha
export const changePassword = async (id, password) => {
  return fetchAPI(`/api/users/management/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
};

// DELETE - Deletar usuário
export const deleteUser = async (id) => {
  return fetchAPI(`/api/users/management/${id}`, {
    method: 'DELETE',
  });
};

