import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { depotAPI, aktienAPI, transactionAPI } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp muss innerhalb von AppProvider verwendet werden');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [depots, setDepots] = useState([]);
  const [aktien, setAktien] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceTimeline, setPerformanceTimeline] = useState([]);

  // User aus localStorage laden
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  // Dark Mode aus localStorage laden
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  // Dark Mode in localStorage speichern
  useEffect(() => {
    if (user) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, user]);

  // Daten laden
  const loadData = async () => {
    try {
      setLoading(true);
      const [depotsRes, aktienRes] = await Promise.all([
        depotAPI.getAll(),
        aktienAPI.getAll()
      ]);
      
      setDepots(depotsRes.data);
      setAktien(aktienRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    loadData();
  };

  // Logout
  const logout = () => {
    setUser(null);
    setDepots([]);
    setAktien([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Depot hinzuf�gen
  const addDepot = async (depotData) => {
    try {
      const response = await depotAPI.create(depotData);
      setDepots([...depots, response.data.depot]);
      return response.data.depot;
    } catch (error) {
      console.error('Fehler beim Hinzuf�gen des Depots:', error);
      throw error;
    }
  };

  // Depot aktualisieren
  const updateDepot = async (id, depotData) => {
    try {
      const response = await depotAPI.update(id, depotData);
      setDepots(depots.map(d => d.id === id ? response.data.depot : d));
      return response.data.depot;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Depots:', error);
      throw error;
    }
  };

  // Depot l�schen
  const deleteDepot = async (id) => {
    try {
      await depotAPI.delete(id);
      setDepots(depots.filter(d => d.id !== id));
      setAktien(aktien.filter(a => a.depot_id !== id));
    } catch (error) {
      console.error('Fehler beim L�schen des Depots:', error);
      throw error;
    }
  };

  // Aktie hinzuf�gen
  const addAktie = async (aktieData) => {
    try {
      const response = await aktienAPI.create(aktieData);
      setAktien([...aktien, response.data.aktie]);
      return response.data.aktie;
    } catch (error) {
      console.error('Fehler beim Hinzuf�gen der Aktie:', error);
      throw error;
    }
  };

  // Aktie aktualisieren
  const updateAktie = async (id, aktieData) => {
    try {
      const response = await aktienAPI.update(id, aktieData);
      setAktien(aktien.map(a => a.id === id ? response.data.aktie : a));
      return response.data.aktie;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aktie:', error);
      throw error;
    }
  };

  // Aktie l�schen
  const deleteAktie = async (id) => {
    try {
      await aktienAPI.delete(id);
      setAktien(aktien.filter(a => a.id !== id));
    } catch (error) {
      console.error('Fehler beim L�schen der Aktie:', error);
      throw error;
    }
  };

  // Aktien importieren
  const importAktien = async (depotId, aktienList) => {
    try {
      const response = await aktienAPI.import({ depot_id: depotId, aktien: aktienList });
      await loadData();
      return response.data;
    } catch (error) {
      console.error('Fehler beim Importieren der Aktien:', error);
      throw error;
    }
  };

  // Aktie kaufen
  const buyAktie = async (buyData) => {
    try {
      const response = await transactionAPI.buy(buyData);
      await loadData();
      return response.data;
    } catch (error) {
      console.error('Fehler beim Kauf:', error);
      throw error;
    }
  };

  // Aktie verkaufen
  const sellAktie = async (sellData) => {
    try {
      const response = await transactionAPI.sell(sellData);
      await loadData();
      return response.data;
    } catch (error) {
      console.error('Fehler beim Verkauf:', error);
      throw error;
    }
  };

  // Depot-Daten l�schen (nur Aktien)
  const clearDepotData = async (depotId) => {
    try {
      const response = await depotAPI.clearDepotData(depotId);
      await loadData();
      return response.data;
    } catch (error) {
      console.error('Fehler beim L�schen der Depot-Daten:', error);
      throw error;
    }
  };

  // Alle Daten l�schen (au�er Account)
  const clearAllUserData = async () => {
    try {
      const response = await depotAPI.clearAllUserData();
      await loadData();
      return response.data;
    } catch (error) {
      console.error('Fehler beim L�schen aller Daten:', error);
      throw error;
    }
  };

  // Timeline Daten laden - MIT useCallback um Infinite Loop zu vermeiden
  const loadUserTimeline = useCallback(async () => {
    try {
      const response = await transactionAPI.getUserTimeline();
      setPerformanceTimeline(response.data);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden der Timeline:', error);
      return [];
    }
  }, []); // Keine Dependencies - wird nur einmal erstellt

  const loadDepotTimeline = useCallback(async (depotId) => {
    try {
      const response = await transactionAPI.getDepotTimeline(depotId);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden der Depot-Timeline:', error);
      return [];
    }
  }, []); // Keine Dependencies - wird nur einmal erstellt

  const value = {
    darkMode,
    setDarkMode,
    user,
    depots,
    aktien,
    loading,
    performanceTimeline,
    login,
    logout,
    addDepot,
    updateDepot,
    deleteDepot,
    addAktie,
    updateAktie,
    deleteAktie,
    importAktien,
    buyAktie,
    sellAktie,
    clearDepotData,
    clearAllUserData,
    loadUserTimeline,
    loadDepotTimeline,
    loadData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};