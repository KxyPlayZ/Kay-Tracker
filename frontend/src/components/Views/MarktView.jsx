// frontend/src/components/Views/MarktView.jsx
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';

const MarktView = () => {
  const { darkMode, aktien } = useApp();

  // Beispiel Performance-Daten für Mini-Charts
  const miniData = [
    { value: 95 }, { value: 94 }, { value: 96 }, { value: 98 }, { value: 100 }
  ];

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
      <h3 className="text-lg font-semibold mb-4">Alle Aktien</h3>
      <div className="grid grid-cols-2 gap-4">
        {aktien.map((aktie) => {
          const gainPercent = ((parseFloat(aktie.current_price) - parseFloat(aktie.buy_price)) / parseFloat(aktie.buy_price)) * 100;
          const isPositive = gainPercent >= 0;
          
          return (
            <div key={aktie.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg hover:shadow-md transition-shadow`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{aktie.name}</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{aktie.symbol}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  {aktie.category}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold">€{parseFloat(aktie.current_price).toFixed(2)}</span>
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                </span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isPositive ? '#10b981' : '#ef4444'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {aktie.depot_name && `Depot: ${aktie.depot_name}`}
              </div>
            </div>
          );
        })}
      </div>
      {aktien.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Noch keine Aktien vorhanden. Füge deine erste Aktie hinzu!
        </div>
      )}
    </div>
  );
};

export default MarktView;
