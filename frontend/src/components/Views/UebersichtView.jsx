import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { transactionAPI } from '../../services/api';
import PerformanceChart from '../Charts/PerformanceChart';
import DistributionChart from '../Charts/DistributionChart';

const UebersichtView = () => {
  const { darkMode, depots, aktien } = useApp();
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    const loadAllTransactions = async () => {
      try {
        const response = await transactionAPI.getUserTimeline();
        setAllTransactions(response.data || []);
      } catch (error) {
        console.error('Fehler beim Laden der Transaktionen:', error);
      }
    };
    loadAllTransactions();
  }, [aktien]);

  const calculatePortfolioStats = () => {
    const activeAktien = aktien.filter(a => {
      const shares = parseFloat(a.current_shares || a.shares || 0);
      return shares > 0;
    });
    
    const totalInvested = activeAktien.reduce((sum, a) => {
      const shares = parseFloat(a.current_shares || a.shares || 0);
      const buyPrice = parseFloat(a.buy_price || 0);
      return sum + (shares * buyPrice);
    }, 0);
    
    const currentValue = activeAktien.reduce((sum, a) => {
      const shares = parseFloat(a.current_shares || a.shares || 0);
      const currentPrice = parseFloat(a.current_price || 0);
      return sum + (shares * currentPrice);
    }, 0);
    
    const cashStart = depots.reduce((sum, d) => 
      sum + parseFloat(d.cash_bestand || 0), 0
    );

    const realizedGains = allTransactions
      .filter(t => t.type === 'SELL')
      .reduce((sum, t) => sum + parseFloat(t.gewinn_verlust || 0), 0);
    
    const unrealizedGains = currentValue - totalInvested;
    const currentCash = cashStart - totalInvested + realizedGains;
    const totalValue = currentValue + currentCash;
    const totalGains = realizedGains + unrealizedGains;
    const totalReturn = cashStart > 0 ? ((totalValue - cashStart) / cashStart) * 100 : 0;

    const distribution = {};
    activeAktien.forEach(a => {
      const shares = parseFloat(a.current_shares || a.shares || 0);
      const value = shares * parseFloat(a.current_price || 0);
      
      if (value > 0) {
        if (distribution[a.name]) {
          distribution[a.name] += value;
        } else {
          distribution[a.name] = value;
        }
      }
    });

    const pieData = Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
        percentage: currentValue > 0 ? ((value / currentValue) * 100).toFixed(1) : '0.0'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const tradesByStock = {};
    allTransactions.forEach(t => {
      if (t.type === 'SELL') {
        const key = t.symbol;
        if (!tradesByStock[key]) {
          tradesByStock[key] = {
            name: t.name,
            symbol: t.symbol,
            totalGain: 0,
            totalShares: 0
          };
        }
        tradesByStock[key].totalGain += parseFloat(t.gewinn_verlust || 0);
        tradesByStock[key].totalShares += parseFloat(t.shares);
      }
    });

    const stockPerformances = Object.values(tradesByStock);
    
    const bestAlltime = stockPerformances.length > 0
      ? stockPerformances.sort((a, b) => b.totalGain - a.totalGain)[0]
      : null;
      
    const worstAlltime = stockPerformances.length > 0
      ? [...stockPerformances].sort((a, b) => a.totalGain - b.totalGain)[0]
      : null;

    return { 
      cashStart,
      currentCash,
      totalInvested, 
      currentValue, 
      unrealizedGains,
      realizedGains,
      totalValue,
      totalGains,
      totalReturn,
      pieData, 
      bestAlltime, 
      worstAlltime,
      hasActivePositions: activeAktien.length > 0,
      activeCount: activeAktien.length
    };
  };

  const stats = calculatePortfolioStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Performance Gesamt</h3>
          <PerformanceChart darkMode={darkMode} depotId={null} />
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Zusammenfassung</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cash Start</span>
              <span className="font-semibold">{stats.cashStart.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cashbestand</span>
              <span className="font-semibold">{stats.currentCash.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Investiert</span>
              <span className="font-semibold">{stats.totalInvested.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Aktueller Wert</span>
              <span className="font-semibold">{stats.currentValue.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Realisierte Gewinne</span>
              <span className={`font-semibold ${stats.realizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.realizedGains.toFixed(2)} EUR
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Unrealisierte Gewinne</span>
              <span className={`font-semibold ${stats.unrealizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.unrealizedGains.toFixed(2)} EUR
              </span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gesamtwert</span>
              <span className="font-semibold text-lg">{stats.totalValue.toFixed(2)} EUR</span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gesamtrendite</span>
              <span className={`font-semibold ${stats.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.totalReturn.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>IZF (Intern. Zinsfuß)</span>
              <span className="font-semibold">
                {stats.totalReturn.toFixed(2)}%
              </span>
            </div>
            
            {stats.bestAlltime && (
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Beste Aktie (Alltime)</span>
                <span className="font-semibold text-green-500">
                  {stats.bestAlltime.name} (+{stats.bestAlltime.totalGain.toFixed(2)} EUR)
                </span>
              </div>
            )}
            
            {stats.worstAlltime && (
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Schlechteste Aktie (Alltime)</span>
                <span className="font-semibold text-red-500">
                  {stats.worstAlltime.name} ({stats.worstAlltime.totalGain.toFixed(2)} EUR)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.hasActivePositions && stats.pieData.length > 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">
            Portfolio-Verteilung ({stats.activeCount} aktive Position{stats.activeCount !== 1 ? 'en' : ''})
          </h3>
          <DistributionChart data={stats.pieData} darkMode={darkMode} />
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <div className="text-center py-8">
            <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Keine aktiven Positionen vorhanden
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UebersichtView;