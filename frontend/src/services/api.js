import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function für Auth Header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
};

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
  getTradeHistory: (depotId) => api.get(`/aktien/history/depot/${depotId}`),
  updatePrices: (depotId) => api.put(`/aktien/prices/${depotId}`),
  refreshSinglePrice: (aktieId) => api.put(`/aktien/refresh/${aktieId}`),
};


export const transactionAPI = {
  buy: (data) => api.post('/transactions/buy', data),
  sell: (data) => api.post('/transactions/sell', data),
  getTransactions: (aktieId) => api.get(`/transactions/${aktieId}`),
  getDepotTimeline: (depotId) => api.get(`/transactions/timeline/depot/${depotId}`),
  getUserTimeline: () => api.get('/transactions/timeline/user'),
  deleteTransaction: (transactionId) => api.delete(`/transactions/${transactionId}`),
};

// Helper Funktionen für AddModal.jsx
export const addDepot = async (data) => {
  const response = await api.post('/depots', data);
  return response.data;
};

export const buyAktie = async (data) => {
  const response = await api.post('/transactions/buy', data);
  return response.data;
};

export const sellAktie = async (data) => {
  const response = await api.post('/transactions/sell', data);
  return response.data;
};

export const importAktien = async (depotId, aktienList) => {
  const response = await api.post('/aktien/import', {
    depot_id: depotId,
    aktien: aktienList
  });
  return response.data;
};

// JustTrade CSV Import - AKTUALISIERT MIT import_mode
export const importJustTradeCSV = async (depotId, aktienData, importMode = 'replace') => {
  try {
    const response = await api.post('/aktien/import/justtrade', {
      depot_id: depotId,
      aktien: aktienData,
      import_mode: importMode  // NEU: 'replace' oder 'add'
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim JustTrade Import:', error);
    throw error;
  }
};

// Alle Preise eines Depots aktualisieren
export const updateDepotPrices = async (depotId) => {
  try {
    const response = await api.post(`/aktien/prices/update/${depotId}`, {});
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Preise:', error);
    throw error;
  }
};

// Einzelnen Aktienpreis aktualisieren
export const refreshSinglePrice = async (aktieId) => {
  try {
    const response = await api.post(`/aktien/prices/refresh/${aktieId}`, {});
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Preises:', error);
    throw error;
  }
};

export default api;