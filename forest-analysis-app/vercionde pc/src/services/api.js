import axios from 'axios';
import { localDataStore } from './localDataStore';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const STORAGE_MODE = process.env.REACT_APP_STORAGE_MODE || 'local-first';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

function shouldUseLocal() {
  return STORAGE_MODE === 'local-first' || STORAGE_MODE === 'offline';
}

function canFallbackToLocal(error) {
  return !error.response || error.code === 'ECONNABORTED';
}

async function withMobileStorage(remoteRequest, localRequest) {
  if (shouldUseLocal()) return localRequest();

  try {
    return await remoteRequest();
  } catch (error) {
    if (canFallbackToLocal(error)) return localRequest();
    throw error;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'No se pudo conectar con la API.';

    return Promise.reject({ ...error, friendlyMessage: message });
  }
);

export const zonesService = {
  create: (data) => withMobileStorage(
    () => apiClient.post('/zones', data),
    () => localDataStore.zones.create(data)
  ),
  getAll: () => withMobileStorage(
    () => apiClient.get('/zones'),
    () => localDataStore.zones.getAll()
  ),
  getById: (id) => withMobileStorage(
    () => apiClient.get(`/zones/${id}`),
    () => localDataStore.zones.getById(id)
  ),
  update: (id, data) => withMobileStorage(
    () => apiClient.put(`/zones/${id}`, data),
    () => localDataStore.zones.update(id, data)
  ),
  delete: (id) => withMobileStorage(
    () => apiClient.delete(`/zones/${id}`),
    () => localDataStore.zones.delete(id)
  ),
  getReport: (id) => withMobileStorage(
    () => apiClient.get(`/zones/${id}/report`),
    () => localDataStore.zones.getReport(id)
  ),
};

export const speciesService = {
  create: (data) => withMobileStorage(
    () => apiClient.post('/species', data),
    () => localDataStore.species.create(data)
  ),
  getAll: (type = null) => withMobileStorage(
    () => apiClient.get(type ? `/species?type=${type}` : '/species'),
    () => localDataStore.species.getAll(type)
  ),
  getById: (id) => withMobileStorage(
    () => apiClient.get(`/species/${id}`),
    () => localDataStore.species.getById(id)
  ),
  update: (id, data) => withMobileStorage(
    () => apiClient.put(`/species/${id}`, data),
    () => localDataStore.species.update(id, data)
  ),
  delete: (id) => withMobileStorage(
    () => apiClient.delete(`/species/${id}`),
    () => localDataStore.species.delete(id)
  ),
};

export const reportsService = {
  create: (zoneId, data = {}) => withMobileStorage(
    () => apiClient.post('/reports', { ...data, zone_id: zoneId }),
    () => localDataStore.reports.create(zoneId, data)
  ),
  createForZone: (zoneId, data = {}) => withMobileStorage(
    () => apiClient.post(`/zones/${zoneId}/report`, data),
    () => localDataStore.reports.create(zoneId, data)
  ),
  getAll: () => withMobileStorage(
    () => apiClient.get('/reports'),
    () => localDataStore.reports.getAll()
  ),
  getById: (id) => withMobileStorage(
    () => apiClient.get(`/reports/${id}`),
    () => localDataStore.reports.getById(id)
  ),
  getByZoneId: (zoneId) => withMobileStorage(
    () => apiClient.get(`/reports/zone/${zoneId}`),
    () => localDataStore.reports.getByZoneId(zoneId)
  ),
  update: (id, data) => withMobileStorage(
    () => apiClient.put(`/reports/${id}`, data),
    () => localDataStore.reports.update(id, data)
  ),
};

export const subzonesService = {
  create: (zoneId, data) => withMobileStorage(
    () => apiClient.post(`/zones/${zoneId}/subzones`, data),
    () => localDataStore.subzones.create(zoneId, data)
  ),
  getByZoneId: (zoneId) => withMobileStorage(
    () => apiClient.get(`/zones/${zoneId}/subzones`),
    () => localDataStore.subzones.getByZoneId(zoneId)
  ),
  getById: (id) => withMobileStorage(
    () => apiClient.get(`/subzones/${id}`),
    () => localDataStore.subzones.getById(id)
  ),
  update: (id, data) => withMobileStorage(
    () => apiClient.put(`/subzones/${id}`, data),
    () => localDataStore.subzones.update(id, data)
  ),
  delete: (id) => withMobileStorage(
    () => apiClient.delete(`/subzones/${id}`),
    () => localDataStore.subzones.delete(id)
  ),
};

export default apiClient;
