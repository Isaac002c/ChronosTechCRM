import { apiRequest } from './api.js';

export const getAllContracts = async () =>
  (await apiRequest('/api/contracts')).data;

export const getContractsByClient = async (clientId) =>
  (await apiRequest(`/api/contracts/client/${clientId}`)).data;

export const getContractsByService = async (serviceId) =>
  (await apiRequest(`/api/contracts/service/${serviceId}`)).data;

export const createContract = async (contractData) =>
  (await apiRequest('/api/contracts', { method: 'POST', body: contractData })).data;

export const updateContract = async (id, contractData) =>
  (await apiRequest(`/api/contracts/${id}`, { method: 'PUT', body: contractData })).data;

export const deleteContract = async (id) =>
  (await apiRequest(`/api/contracts/${id}`, { method: 'DELETE' })).data;

export const getAprsStats = async () =>
  (await apiRequest('/api/contracts/aprs-stats')).data;

// Retorna [{ organ, count, active_count }]
export const getContractsByOrgan = async () =>
  (await apiRequest('/api/contracts/by-organ')).data;

export const getContractDashboard = async () =>
  (await apiRequest('/api/contracts/dashboard')).data;