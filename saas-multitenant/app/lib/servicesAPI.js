import { apiRequest } from './api.js';

// Get all services
export const getAllServices = async () =>
  (await apiRequest('/api/services')).data;

// Get services by client
export const getServicesByClient = async (clientId) =>
  (await apiRequest(`/api/services/client/${clientId}`)).data;

// Create service
export const createService = async (serviceData) =>
  (await apiRequest('/api/services', {
    method: 'POST',
    body: serviceData,
  })).data;

// Delete service
export const deleteService = async (serviceId) =>
  (await apiRequest(`/api/services/${serviceId}`, {
    method: 'DELETE',
  })).data;

// Update service
export const updateService = async (serviceId, serviceData) =>
  (await apiRequest(`/api/services/${serviceId}`, {
    method: 'PUT',
    body: serviceData,
  })).data;
