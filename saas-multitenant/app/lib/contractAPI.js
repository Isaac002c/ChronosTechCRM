import { apiRequest } from './api.js';

// Get all contracts
export const getAllContracts = async () =>
  (await apiRequest('/api/contracts')).data;

// Get contracts by client
export const getContractsByClient = async (clientId) =>
  (await apiRequest(`/api/contracts/client/${clientId}`)).data;

// Get contracts by service
export const getContractsByService = async (serviceId) =>
  (await apiRequest(`/api/contracts/service/${serviceId}`)).data;

// Create contract
export const createContract = async (contractData) =>
  (await apiRequest('/api/contracts', {
    method: 'POST',
    body: contractData,
  })).data;

// Update contract
export const updateContract = async (id, contractData) =>
  (await apiRequest(`/api/contracts/${id}`, {
    method: 'PUT',
    body: contractData,
  })).data;

// Delete contract
export const deleteContract = async (id) =>
  (await apiRequest(`/api/contracts/${id}`, {
    method: 'DELETE',
  })).data;

// Dashboard functions (stubs for compatibility)
export const getContractDashboard = async () => ({});
export const getContractsByOrgan = async () => ([]);
export const getContractAlerts = async () => ([]);
export const getContractsNearDue = async () => ([]);
export const getOverdueContracts = async () => ([]);