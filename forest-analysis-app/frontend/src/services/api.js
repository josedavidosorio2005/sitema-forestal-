import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

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
  create: (data) => apiClient.post('/zones', data),
  getAll: () => apiClient.get('/zones'),
  getById: (id) => apiClient.get(`/zones/${id}`),
  update: (id, data) => apiClient.put(`/zones/${id}`, data),
  delete: (id) => apiClient.delete(`/zones/${id}`),
  getReport: (id) => apiClient.get(`/zones/${id}/report`),
};

export const speciesService = {
  create: (data) => apiClient.post('/species', data),
  getAll: (type = null) => apiClient.get(type ? `/species?type=${type}` : '/species'),
  getById: (id) => apiClient.get(`/species/${id}`),
  update: (id, data) => apiClient.put(`/species/${id}`, data),
  delete: (id) => apiClient.delete(`/species/${id}`),
};

export const reportsService = {
  create: (zoneId, data = {}) => apiClient.post('/reports', { ...data, zone_id: zoneId }),
  createForZone: (zoneId, data = {}) => apiClient.post(`/zones/${zoneId}/report`, data),
  getAll: () => apiClient.get('/reports'),
  getById: (id) => apiClient.get(`/reports/${id}`),
  getByZoneId: (zoneId) => apiClient.get(`/reports/zone/${zoneId}`),
  update: (id, data) => apiClient.put(`/reports/${id}`, data),
};

export const subzonesService = {
  create: (zoneId, data) => apiClient.post(`/zones/${zoneId}/subzones`, data),
  getByZoneId: (zoneId) => apiClient.get(`/zones/${zoneId}/subzones`),
  getById: (id) => apiClient.get(`/subzones/${id}`),
  update: (id, data) => apiClient.put(`/subzones/${id}`, data),
  delete: (id) => apiClient.delete(`/subzones/${id}`),
};

export const treesService = {
  create: (data) => apiClient.post('/trees', data),
  createBatch: (trees) => apiClient.post('/trees/batch', { trees }),
  getBySubzoneId: (subzoneId) => apiClient.get(`/trees/subzone/${subzoneId}`),
  getById: (id) => apiClient.get(`/trees/${id}`),
  update: (id, data) => apiClient.put(`/trees/${id}`, data),
  delete: (id) => apiClient.delete(`/trees/${id}`),
  createLog: (treeId, data) => apiClient.post(`/trees/${treeId}/logs`, data),
  getLogs: (treeId) => apiClient.get(`/trees/${treeId}/logs`),
};

export default apiClient;
