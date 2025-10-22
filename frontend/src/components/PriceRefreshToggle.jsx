// frontend/src/components/PriceRefreshToggle.jsx
// OPTIMIERTE VERSION - Aktualisiert NUR Preise, KEIN Page Reload mehr!

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { aktienAPI } from '../services/api';

const PriceRefreshToggle = ({ depotId, darkMode, onPricesUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem(`autoRefresh_${depotId}`);
    return saved === 'true';
  });
  const [countdown, setCountdown] = useState(30);
  
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const autoRefreshRef = useRef(autoRefresh);

  // Aktualisiere NUR die Preise (ohne kompletten Reload!)
  const handleUpdateAllPrices = async (isAutomatic = false) => {
    if (!depotId || updating) return;
    
    setUpdating(true);
    try {
      console.log(isAutomatic ? '⏰ Auto-Refresh...' : '🔄 Manueller Refresh...');
      
      // API Call zum Aktualisieren der Preise
      const result = await aktienAPI.updatePrices(depotId);
      
      // WICHTIG: Rufe onPricesUpdated auf um die Daten zu aktualisieren
      // ABER: Die Komponente sollte smart genug sein, nur Preise zu updaten
      if (onPricesUpdated) {
        await onPricesUpdated();
      }
      
      console.log(`✅ ${result.data.updated} von ${result.data.total} Preisen aktualisiert`);
      
      // Nur bei manuellem Refresh eine Erfolgsmeldung
      if (!isAutomatic) {
        // Optional: Eine dezente Benachrichtigung statt Alert
        console.log('✅ Preise erfolgreich aktualisiert!');
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Preise:', error);
      
      // Nur bei manuellem Refresh einen Fehler anzeigen
      if (!isAutomatic) {
        alert('Fehler beim Aktualisieren der Preise: ' + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Toggle Auto-Refresh
  const toggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    autoRefreshRef.current = newValue;
    localStorage.setItem(`autoRefresh_${depotId}`, newValue.toString());
    
    console.log(newValue ? '🟢 Auto-Refresh aktiviert' : '🔴 Auto-Refresh deaktiviert');
  };

  // Countdown Timer (1 Sekunde Intervall)
  useEffect(() => {
    if (autoRefresh) {
      // Starte Countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 30; // Reset auf 30 Sekunden
          }
          return prev - 1;
        });
      }, 1000); // Jede Sekunde
    } else {
      // Stoppe Countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(30);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [autoRefresh]);

  // Auto-Refresh Interval (30 Sekunden)
  useEffect(() => {
    if (autoRefresh) {
      console.log('⏰ Auto-Refresh Timer gestartet (30 Sekunden)');
      
      // Setze Interval auf 30 Sekunden
      intervalRef.current = setInterval(() => {
        if (autoRefreshRef.current) {
          handleUpdateAllPrices(true); // true = automatisch
        }
      }, 30000); // 30 Sekunden = 30000ms
      
      // WICHTIG: NICHT sofort aktualisieren beim Aktivieren!
      // Warte die vollen 30 Sekunden
    } else {
      console.log('⏸️  Auto-Refresh Timer gestoppt');
      
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, depotId]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Countdown Anzeige (nur wenn Auto aktiv) */}
      {autoRefresh && (
        <div className={`px-3 py-2 rounded font-mono text-sm ${
          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {countdown}s
        </div>
      )}

      {/* Auto-Refresh Toggle Switch */}
      <div className="flex items-center gap-2">
        <label className="flex items-center cursor-pointer" title="Automatische Preisaktualisierung alle 30 Sekunden">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="sr-only"
            />
            {/* Toggle Background */}
            <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${
              autoRefresh 
                ? 'bg-green-500' 
                : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}></div>
            {/* Toggle Circle */}
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
              autoRefresh ? 'transform translate-x-4' : ''
            }`}></div>
          </div>
          <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Auto
          </span>
        </label>
      </div>

      {/* Manueller Refresh Button */}
      <button
        onClick={() => handleUpdateAllPrices(false)} // false = manuell
        disabled={updating}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-all duration-200 ${
          updating 
            ? 'bg-gray-400 cursor-not-allowed opacity-75' 
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
        }`}
        title="Preise manuell aktualisieren"
      >
        <RefreshCw 
          size={18} 
          className={updating ? 'animate-spin' : ''} 
        />
        <span className="font-medium">
          {updating ? 'Aktualisiere...' : 'Aktualisieren'}
        </span>
      </button>
    </div>
  );
};

export default PriceRefreshToggle;