// frontend/src/components/Views/DepotView.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aktienAPI } from '../../services/api';
import PerformanceChart from '../Charts/PerformanceChart';
import PriceRefreshToggle from '../PriceRefreshToggle';

const DepotView = ({ depot }) => {
  const { darkMode, aktien } = useApp();
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Aktuelle Trades (nur Aktien mit current_shares > 0)
  const currentTrades = aktien.filter(a => 
    a.depot_id === depot.id && parseFloat(a.current_shares || a.shares) > 0
  );
  
  const depotValue = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.current_price)), 0
  );
  
  const depotInvested = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.buy_price)), 0
  );
  
  const depotGain = depotValue - depotInvested;

  // Trade-Historie laden
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await aktienAPI.getTradeHistory(depot.id);
        setTradeHistory(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Historie:', error);
      } finally {
        setLoading(false);
      }
    };

    if (depot.id) {
      loadHistory();
    }
  }, [depot.id]);

  // Funktion zum Aktualisieren aller Preise
  const handleUpdateAllPrices = async () => {
    if (!depot) return;
    
    setUpdatingPrices(true);
    try {
      const result = await aktienAPI.updatePrices(depot.id);
      setLastUpdate(new Date());
      alert(`Preise aktualisiert: ${result.data.updated} von ${result.data.total} Aktien`);
      window.location.reload();
    } catch (error) {
      alert('Fehler beim Aktualisieren der Preise: ' + error.message);
    } finally {
      setUpdatingPrices(false);
    }
  };

  // Funktion zum Aktualisieren eines einzelnen Preises
  const handleRefreshSinglePrice = async (aktieId) => {
    try {
      const result = await aktienAPI.refreshSinglePrice(aktieId);
      alert(`Preis aktualisiert: ${result.data.symbol} - €${result.data.new_price}`);
      window.location.reload();
    } catch (error) {
      alert('Fehler beim Aktualisieren des Preises: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Performance und Zusammenfassung */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Performance {depot.name}</h3>
          <PerformanceChart darkMode={darkMode} color="#10b981" depotId={depot.id} />
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Zusammenfassung</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cashbestand</span>
              <span className="font-semibold">€{parseFloat(depot.cash_bestand || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Investiert</span>
              <span className="font-semibold">€{depotInvested.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Aktueller Wert</span>
              <span className="font-semibold">€{depotValue.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gewinn/Verlust</span>
              <span className={`font-semibold text-lg ${depotGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {depotGain >= 0 ? '+' : ''}€{depotGain.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                ({((depotGain / depotInvested) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aktuelle Trades Tabelle - MIT ISIN/Symbol Spalte */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Aktuelle Trades im Besitz</h3>
          <PriceRefreshToggle 
            depotId={depot.id} 
            onPricesUpdated={() => window.location.reload()} 
            darkMode={darkMode} 
          />
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Lädt...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">ISIN / Symbol</th>
                  <th className="px-4 py-3 text-right">Anzahl</th>
                  <th className="px-4 py-3 text-right">Kaufpreis</th>
                  <th className="px-4 py-3 text-right">Aktuell</th>
                  <th className="px-4 py-3 text-right">Gewinn/Verlust</th>
                  <th className="px-4 py-3 text-right">Gesamtwert</th>
                  <th className="px-4 py-3 text-center">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {currentTrades.map((aktie) => {
                  const shares = parseFloat(aktie.current_shares || aktie.shares);
                  if (shares <= 0) return null;

                  const gain = (parseFloat(aktie.current_price) - parseFloat(aktie.buy_price)) * shares;
                  const gainPercent = ((parseFloat(aktie.current_price) - parseFloat(aktie.buy_price)) / parseFloat(aktie.buy_price)) * 100;

                  return (
                    <tr key={aktie.id} className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <td className="px-4 py-3">{aktie.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {aktie.isin && (
                            <span className="text-xs text-gray-500">{aktie.isin}</span>
                          )}
                          <span className="font-medium">{aktie.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{shares.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">€{parseFloat(aktie.buy_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">€{parseFloat(aktie.current_price).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        €{gain.toFixed(2)} ({gainPercent.toFixed(2)}%)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        €{(shares * parseFloat(aktie.current_price)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRefreshSinglePrice(aktie.id)}
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Preis aktualisieren"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {currentTrades.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine aktuellen Aktien im Besitz
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade Verlauf (Historie) - MIT ISIN/Symbol */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-4">Trade Verlauf (Alle Aktivitäten)</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Lädt...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left">Datum</th>
                  <th className="px-4 py-3 text-left">Typ</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">ISIN / Symbol</th>
                  <th className="px-4 py-3 text-right">Anzahl</th>
                  <th className="px-4 py-3 text-right">Preis/Stück</th>
                  <th className="px-4 py-3 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((trade) => {
                  const total = parseFloat(trade.shares) * parseFloat(trade.price);
                  const isBuy = trade.type === 'BUY';
                  
                  return (
                    <tr key={trade.id} className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <td className="px-4 py-3">
                        {new Date(trade.transaction_timestamp).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isBuy 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isBuy ? 'KAUF' : 'VERKAUF'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{trade.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {trade.isin && (
                            <span className="text-xs text-gray-500">{trade.isin}</span>
                          )}
                          <span className="font-medium">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{parseFloat(trade.shares).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">€{parseFloat(trade.price).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        isBuy ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {isBuy ? '-' : '+'}€{total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tradeHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Noch keine Transaktionen vorhanden
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotView;
