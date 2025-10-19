// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Token zu jedem Request hinzufügen
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Bei 401 zum Login weiterleiten
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Depot API
export const depotAPI = {
  getAll: () => api.get('/depots'),
  getOne: (id) => api.get(`/depots/${id}`),
  create: (data) => api.post('/depots', data),
  update: (id, data) => api.put(`/depots/${id}`, data),
  delete: (id) => api.delete(`/depots/${id}`),
  getStats: (id) => api.get(`/depots/${id}/stats`),
  clearDepotData: (id) => api.delete(`/depots/${id}/clear`),        // NEU
  clearAllUserData: () => api.delete('/depots/clear-all/user-data'), // NEU
  getTradeHistory: (depotId) => api.get(`/aktien/history/depot/${depotId}`),
};

// Aktien API
export const aktienAPI = {
  getAll: () => api.get('/aktien'),
  getByDepot: (depotId) => api.get(`/aktien/depot/${depotId}`),
  getOne: (id) => api.get(`/aktien/${id}`),
  create: (data) => api.post('/aktien', data),
  update: (id, data) => api.put(`/aktien/${id}`, data),
  delete: (id) => api.delete(`/aktien/${id}`),
  import: (data) => api.post('/aktien/import', data),
};

// Transaction API
export const transactionAPI = {
  buy: (data) => api.post('/transactions/buy', data),
  sell: (data) => api.post('/transactions/sell', data),
  getTransactions: (aktieId) => api.get(`/transactions/${aktieId}`),
  getDepotTimeline: (depotId) => api.get(`/transactions/timeline/depot/${depotId}`),
  getUserTimeline: () => api.get('/transactions/timeline/user'),
};

export default api;
