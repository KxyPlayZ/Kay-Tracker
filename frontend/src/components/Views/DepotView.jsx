import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { depotAPI, transactionAPI } from '../../services/api';
import PerformanceChart from '../Charts/PerformanceChart';
import { Trash2 } from 'lucide-react';

const DepotView = ({ depot }) => {
  const { darkMode, aktien, loadData } = useApp();
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentTrades = aktien.filter(a => 
    a.depot_id === depot.id && parseFloat(a.current_shares || a.shares) > 0
  );
  
  const depotValue = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.current_price)), 0
  );
  
  const totalInvested = currentTrades.reduce((sum, a) => 
    sum + (parseFloat(a.current_shares || a.shares) * parseFloat(a.buy_price)), 0
  );

  const realizedGains = tradeHistory
    .filter(t => t.type === 'SELL')
    .reduce((sum, t) => {
      const buyPrice = parseFloat(t.buy_price || 0);
      const sellPrice = parseFloat(t.price);
      const shares = parseFloat(t.shares);
      return sum + ((sellPrice - buyPrice) * shares);
    }, 0);

  const unrealizedGains = depotValue - totalInvested;
  const cashStart = parseFloat(depot.cash_bestand || 0);
  const currentCash = cashStart - totalInvested + realizedGains;
  const totalValue = depotValue + currentCash;
  const totalGains = realizedGains + unrealizedGains;
  const totalReturn = cashStart > 0 ? ((totalValue - cashStart) / cashStart) * 100 : 0;

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await depotAPI.getTradeHistory(depot.id);
      setTradeHistory(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Historie:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (depot.id) {
      loadHistory();
    }
  }, [depot.id]);

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Möchtest du diese Transaktion wirklich löschen?')) {
      return;
    }

    try {
      await transactionAPI.deleteTransaction(transactionId);
      await loadData();
      await loadHistory();
      alert('Transaktion erfolgreich gelöscht');
    } catch (error) {
      alert('Fehler beim Löschen: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Performance {depot.name}</h3>
          <PerformanceChart darkMode={darkMode} color="#10b981" depotId={depot.id} />
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Zusammenfassung</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cash Start</span>
              <span className="font-semibold">{cashStart.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cashbestand</span>
              <span className="font-semibold">{currentCash.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Investiert</span>
              <span className="font-semibold">{totalInvested.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Aktueller Wert</span>
              <span className="font-semibold">{depotValue.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Realisierte Gewinne</span>
              <span className={`font-semibold ${realizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {realizedGains.toFixed(2)} EUR
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Unrealisierte Gewinne</span>
              <span className={`font-semibold ${unrealizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {unrealizedGains.toFixed(2)} EUR
              </span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gesamtwert</span>
              <span className="font-semibold text-lg">{totalValue.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gesamtrendite</span>
              <span className={`font-semibold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalReturn.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>IZF (Intern. Zinsfuß)</span>
              <span className="font-semibold">
                {totalReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-4">Aktuelle Trades (Im Besitz)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-right">Anzahl</th>
                <th className="px-4 py-3 text-right">Kaufpreis</th>
                <th className="px-4 py-3 text-right">Aktueller Preis</th>
                <th className="px-4 py-3 text-right">Gewinn/Verlust</th>
                <th className="px-4 py-3 text-right">Gesamtwert</th>
              </tr>
            </thead>
            <tbody>
              {currentTrades.map((aktie) => {
                const shares = parseFloat(aktie.current_shares || aktie.shares);
                const gain = (parseFloat(aktie.current_price) - parseFloat(aktie.buy_price)) * shares;
                const gainPercent = ((parseFloat(aktie.current_price) - parseFloat(aktie.buy_price)) / parseFloat(aktie.buy_price)) * 100;
                
                return (
                  <tr key={aktie.id} className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <td className="px-4 py-3">{aktie.name}</td>
                    <td className="px-4 py-3">{aktie.symbol}</td>
                    <td className="px-4 py-3 text-right">{shares.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{parseFloat(aktie.buy_price).toFixed(2)} EUR</td>
                    <td className="px-4 py-3 text-right">{parseFloat(aktie.current_price).toFixed(2)} EUR</td>
                    <td className={`px-4 py-3 text-right ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {gain.toFixed(2)} EUR ({gainPercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {(shares * parseFloat(aktie.current_price)).toFixed(2)} EUR
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
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-4">Trade Verlauf (Alle Aktivitäten)</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Lädt...</div>
        ) : tradeHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Keine Trades vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left">Datum & Uhrzeit</th>
                  <th className="px-4 py-3 text-left">Typ</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-right">Anzahl</th>
                  <th className="px-4 py-3 text-right">Preis/Stueck</th>
                  <th className="px-4 py-3 text-right">Gesamt</th>
                  <th className="px-4 py-3 text-right">Gewinn/Verlust</th>
                  <th className="px-4 py-3 text-center">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((trade) => {
                  const total = parseFloat(trade.shares) * parseFloat(trade.price);
                  const isBuy = trade.type === 'BUY';
                  const date = new Date(trade.transaction_timestamp);
                  
                  let profitLoss = null;
                  if (!isBuy) {
                    const buyPrice = parseFloat(trade.buy_price || 0);
                    const sellPrice = parseFloat(trade.price);
                    profitLoss = (sellPrice - buyPrice) * parseFloat(trade.shares);
                  }
                  
                  return (
                    <tr key={trade.id} className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <td className="px-4 py-3">
                        <div>{date.toLocaleDateString('de-DE')}</div>
                        <div className="text-sm text-gray-500">{date.toLocaleTimeString('de-DE')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          isBuy 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isBuy ? 'KAUF' : 'VERKAUF'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{trade.name}</td>
                      <td className="px-4 py-3">{trade.symbol}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(trade.shares).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(trade.price).toFixed(2)} EUR</td>
                      <td className="px-4 py-3 text-right font-semibold">{total.toFixed(2)} EUR</td>
                      <td className="px-4 py-3 text-right">
                        {profitLoss !== null ? (
                          <span className={profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)} EUR
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(trade.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Transaktion löschen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotView;