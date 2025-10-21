// frontend/src/components/PriceRefreshToggle.jsx
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { aktienAPI } from '../services/api';

const PriceRefreshToggle = ({ depotId, darkMode, onPricesUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    // Lade gespeicherten Status aus localStorage
    const saved = localStorage.getItem(`autoRefresh_${depotId}`);
    return saved === 'true';
  });
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const handleUpdateAllPrices = async () => {
    if (!depotId) return;
    
    setUpdating(true);
    try {
      const result = await aktienAPI.updatePrices(depotId);
      
      // NUR Daten aktualisieren, KEINE Seite neu laden!
      if (onPricesUpdated) {
        await onPricesUpdated();
      }
      
      // Keine Alert-Meldung bei Auto-Refresh
      console.log(`Preise aktualisiert: ${result.data.updated} von ${result.data.total} Aktien`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Preise:', error);
      // Nur bei Fehler eine Meldung zeigen
      if (!autoRefresh) {
        alert('Fehler beim Aktualisieren der Preise: ' + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Speichere Auto-Refresh Status wenn er sich ändert
  const toggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem(`autoRefresh_${depotId}`, newValue.toString());
  };

  useEffect(() => {
    if (autoRefresh) {
      // Countdown starten
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-Refresh alle 30 Sekunden
      intervalRef.current = setInterval(() => {
        handleUpdateAllPrices();
      }, 30000);

      // Sofort beim Aktivieren aktualisieren
      handleUpdateAllPrices();
    } else {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(30);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [autoRefresh, depotId]);

  return (
    <div className="flex items-center gap-3">
      {/* Auto-Aktualisierung Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="sr-only"
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${
              autoRefresh ? 'bg-green-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
              autoRefresh ? 'transform translate-x-4' : ''
            }`}></div>
          </div>
          <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Auto {autoRefresh && `(${countdown}s)`}
          </span>
        </label>
      </div>

      {/* Manueller Refresh Button */}
      <button
        onClick={handleUpdateAllPrices}
        disabled={updating}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
          updating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title="Alle Preise manuell aktualisieren"
      >
        <RefreshCw size={18} className={updating ? 'animate-spin' : ''} />
        {updating ? 'Aktualisiere...' : 'Preise aktualisieren'}
      </button>
    </div>
  );
};

export default PriceRefreshToggle;