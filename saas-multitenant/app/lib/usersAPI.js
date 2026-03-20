const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (localToken) return localToken;

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

// ✅ ROTAS CORRETAS

export const getUsers = async () => {
  return fetchAPI('/users/management');
};

export const getUsersStats = async () => {
  return fetchAPI('/users/management/stats');
};

export const getRoles = async () => {
  return fetchAPI('/users/management/roles');
};

export const getUserById = async (id) => {
  return fetchAPI(`/users/management/${id}`);
};

export const createUser = async (userData) => {
  return fetchAPI('/users/management', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (id, userData) => {
  return fetchAPI(`/users/management/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const changePassword = async (id, password) => {
  return fetchAPI(`/users/management/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
};

export const deleteUser = async (id) => {
  return fetchAPI(`/users/management/${id}`, {
    method: 'DELETE',
  });
};