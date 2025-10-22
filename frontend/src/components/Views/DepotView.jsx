// frontend/src/components/Views/DepotView.jsx
// OPTIMIERTE VERSION - Aktualisiert NUR Preise, KEIN kompletter Reload!

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aktienAPI } from '../../services/api';
import PerformanceChart from '../Charts/PerformanceChart';
import PriceRefreshToggle from '../PriceRefreshToggle';

const DepotView = ({ depot }) => {
  const { darkMode, aktien, setAktien } = useApp(); // setAktien hinzugefügt!
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentTrades = aktien.filter(a => 
    a.depot_id === depot.id && parseFloat(a.current_shares || a.shares) > 0
  );
  
  const depotValue = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.current_price)), 0
  );
  
  const depotInvested = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.buy_price)), 0
  );
  
  const unrealizedGains = depotValue - depotInvested;
  
  const realizedGains = tradeHistory
    .filter(t => t.type === 'SELL')
    .reduce((sum, t) => {
      const buyPrice = parseFloat(t.buy_price || 0);
      const sellPrice = parseFloat(t.price);
      const shares = parseFloat(t.shares);
      return sum + ((sellPrice - buyPrice) * shares);
    }, 0);

  const cashStart = parseFloat(depot.cash_bestand || 0);
  const currentCash = cashStart - depotInvested + realizedGains;
  const totalValue = depotValue + currentCash;
  const totalReturn = cashStart > 0 ? ((totalValue - cashStart) / cashStart) * 100 : 0;

  // Lade Historie (nur einmal beim Mount)
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

  // 🎯 NEUE FUNKTION: Aktualisiere NUR die Preise (kein kompletter Reload!)
  const refreshPricesOnly = async () => {
    try {
      console.log('🔄 Aktualisiere nur Preise für Depot:', depot.id);
      
      // Hole die aktualisierten Aktien vom Server
      const response = await aktienAPI.getByDepot(depot.id);
      const updatedAktien = response.data;
      
      // Aktualisiere nur die Aktien für dieses Depot im State
      setAktien(prevAktien => {
        return prevAktien.map(aktie => {
          // Finde die aktualisierte Version dieser Aktie
          const updated = updatedAktien.find(u => u.id === aktie.id);
          
          // Wenn gefunden, aktualisiere NUR den current_price
          if (updated) {
            return {
              ...aktie,
              current_price: updated.current_price
            };
          }
          
          // Ansonsten behalte die Aktie unverändert
          return aktie;
        });
      });
      
      console.log('✅ Preise erfolgreich aktualisiert (ohne Page Reload)');
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Preise:', error);
    }
  };

  // Einzelnen Preis aktualisieren
  const handleRefreshSinglePrice = async (aktieId) => {
    try {
      const result = await aktienAPI.refreshSinglePrice(aktieId);
      
      // Aktualisiere nur diesen einen Preis im State
      setAktien(prevAktien => {
        return prevAktien.map(aktie => {
          if (aktie.id === aktieId) {
            return {
              ...aktie,
              current_price: result.data.new_price
            };
          }
          return aktie;
        });
      });
      
      console.log(`✅ Preis aktualisiert: ${result.data.symbol} - €${result.data.new_price}`);
    } catch (error) {
      alert('Fehler beim Aktualisieren des Preises: ' + error.message);
    }
  };

  // Lade Historie beim Mount
  useEffect(() => {
    if (depot.id) {
      loadHistory();
    }
  }, [depot.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Performance {depot.name}</h3>
          <PerformanceChart darkMode={darkMode} color="#10b981" depotId={depot.id} />
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Depot Übersicht</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Depotwert</span>
              <span className="font-semibold">€{depotValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Bargeld</span>
              <span className="font-semibold">€{currentCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gesamtwert</span>
              <span className="font-semibold">€{totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 mt-3">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Unrealisierter Gewinn</span>
              <span className={`font-semibold ${unrealizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                €{unrealizedGains.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Realisierter Gewinn</span>
              <span className={`font-semibold ${realizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                €{realizedGains.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Rendite</span>
              <span className={`font-semibold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aktuelle Trades Tabelle */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Aktuelle Trades im Besitz</h3>
          {/* WICHTIG: Übergebe refreshPricesOnly statt loadData! */}
          <PriceRefreshToggle 
            depotId={depot.id}
            darkMode={darkMode}
            onPricesUpdated={refreshPricesOnly}
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
                      <td className="px-4 py-3 text-right font-semibold">€{parseFloat(aktie.current_price).toFixed(2)}</td>
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

      {/* Trade Verlauf */}
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
                        <span className={`font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
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