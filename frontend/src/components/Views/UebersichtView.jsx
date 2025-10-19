// frontend/src/components/Views/UebersichtView.jsx
import React from 'react';
import { useApp } from '../../context/AppContext';
import PerformanceChart from '../Charts/PerformanceChart';
import DistributionChart from '../Charts/DistributionChart';

const UebersichtView = () => {
  const { darkMode, depots, aktien } = useApp();

  const calculatePortfolioStats = () => {
    const totalInvested = aktien.reduce((sum, a) => 
      sum + (parseFloat(a.shares) * parseFloat(a.buy_price)), 0
    );
    
    const currentValue = aktien.reduce((sum, a) => 
      sum + (parseFloat(a.shares) * parseFloat(a.current_price)), 0
    );
    
    const totalCash = depots.reduce((sum, d) => 
      sum + parseFloat(d.cash_bestand || 0), 0
    );
    
    const realizedGains = currentValue - totalInvested;
    const totalValue = currentValue + totalCash;

    const distribution = {};
    aktien.forEach(a => {
      const value = parseFloat(a.shares) * parseFloat(a.current_price);
      if (distribution[a.name]) {
        distribution[a.name] += value;
      } else {
        distribution[a.name] = value;
      }
    });

    const pieData = Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / currentValue) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value);

    const aktienWithGains = aktien.map(a => ({
      ...a,
      gainPercent: ((parseFloat(a.current_price) - parseFloat(a.buy_price)) / parseFloat(a.buy_price)) * 100
    }));

    const bestGain = [...aktienWithGains].sort((a, b) => b.gainPercent - a.gainPercent)[0];
    const worstLoss = [...aktienWithGains].sort((a, b) => a.gainPercent - b.gainPercent)[0];

    return { 
      totalInvested, 
      currentValue, 
      totalCash, 
      realizedGains, 
      totalValue, 
      pieData, 
      bestGain, 
      worstLoss 
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
          <h3 className="text-lg font-semibold mb-4">Zusammen Fassung</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cashbestand</span>
              <span className="font-semibold">€{stats.totalCash.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Investiert</span>
              <span className="font-semibold">€{stats.totalInvested.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Realisierte Gewinne</span>
              <span className={`font-semibold ${stats.realizedGains >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                €{stats.realizedGains.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>IZF</span>
              <span className="font-semibold">
                {stats.totalInvested > 0 ? ((stats.realizedGains / stats.totalInvested) * 100).toFixed(2) : '0.00'}%
              </span>
            </div>
            {stats.bestGain && (
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Beste Gewinn Aktie</span>
                <span className="font-semibold text-green-500">
                  {stats.bestGain.name} (+{stats.bestGain.gainPercent.toFixed(1)}%)
                </span>
              </div>
            )}
            {stats.worstLoss && (
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Beste Verlust Aktie</span>
                <span className="font-semibold text-red-500">
                  {stats.worstLoss.name} ({stats.worstLoss.gainPercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-4">Verteilung</h3>
        <DistributionChart data={stats.pieData} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default UebersichtView;
