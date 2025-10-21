// frontend/src/components/PriceRefreshToggle.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { aktienAPI } from '../services/api';

const PriceRefreshToggle = ({ depotId, onPricesUpdated, darkMode }) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [interval, setIntervalValue] = useState(10);

  useEffect(() => {
    if (!autoRefresh || !depotId) return;

    const timer = setInterval(async () => {
      await refreshPrices();
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, depotId, interval]);

  const refreshPrices = async () => {
    try {
      setRefreshing(true);
      const response = await aktienAPI.updatePrices(depotId);
      setLastUpdate(new Date());
      if (onPricesUpdated) {
        onPricesUpdated();
      }
      console.log(`✓ ${response.data.updated} Preise aktualisiert`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Preise:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
      <div className="flex items-center gap-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium">
            {autoRefresh ? 'Auto-Refresh AN' : 'Auto-Refresh AUS'}
          </span>
        </label>
      </div>

      {autoRefresh && (
        <div className="flex items-center gap-2">
          <label className="text-sm">Intervall:</label>
          <select
            value={interval}
            onChange={(e) => setIntervalValue(parseInt(e.target.value))}
            className={`px-2 py-1 rounded border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value={5}>5 Sek</option>
            <option value={10}>10 Sek</option>
            <option value={30}>30 Sek</option>
            <option value={60}>1 Min</option>
            <option value={300}>5 Min</option>
          </select>
        </div>
      )}

      <button
        onClick={refreshPrices}
        disabled={refreshing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        Jetzt aktualisieren
      </button>

      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Zuletzt: {lastUpdate.toLocaleTimeString('de-DE')}
        </span>
      )}
    </div>
  );
};

export default PriceRefreshToggle;