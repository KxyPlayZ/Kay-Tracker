import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const depotAPI = {
  getAll: () => api.get('/depots'),
  getOne: (id) => api.get(`/depots/${id}`),
  create: (data) => api.post('/depots', data),
  update: (id, data) => api.put(`/depots/${id}`, data),
  delete: (id) => api.delete(`/depots/${id}`),
  getStats: (id) => api.get(`/depots/${id}/stats`),
  clearDepotData: (id) => api.delete(`/depots/${id}/clear`),
  clearAllUserData: () => api.delete('/depots/clear-all/user-data'),
  getTradeHistory: (depotId) => api.get(`/aktien/history/depot/${depotId}`),
};

export const aktienAPI = {
  getAll: () => api.get('/aktien'),
  getByDepot: (depotId) => api.get(`/aktien/depot/${depotId}`),
  getOne: (id) => api.get(`/aktien/${id}`),
  create: (data) => api.post('/aktien', data),
  update: (id, data) => api.put(`/aktien/${id}`, data),
  delete: (id) => api.delete(`/aktien/${id}`),
  import: (data) => api.post('/aktien/import', data),
};

export const transactionAPI = {
  buy: (data) => api.post('/transactions/buy', data),
  sell: (data) => api.post('/transactions/sell', data),
  getTransactions: (aktieId) => api.get(`/transactions/${aktieId}`),
  getDepotTimeline: (depotId) => api.get(`/transactions/timeline/depot/${depotId}`),
  getUserTimeline: () => api.get('/transactions/timeline/user'),
  deleteTransaction: (transactionId) => api.delete(`/transactions/${transactionId}`),
};

export default api;