// frontend/src/components/Charts/PerformanceChart.jsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';

const PerformanceChart = ({ darkMode, color = '#3b82f6', depotId = null }) => {
  const { loadUserTimeline, loadDepotTimeline } = useApp();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const timeline = depotId 
          ? await loadDepotTimeline(depotId)
          : await loadUserTimeline();
        
        if (timeline && timeline.length > 0) {
          // Formatiere Daten für Chart
          const formatted = timeline.map(t => ({
            date: new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
            value: parseFloat(t.kumulativer_gewinn || 0),
            fullDate: new Date(t.date)
          }));
          
          setChartData(formatted);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Chart-Daten:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [depotId, loadUserTimeline, loadDepotTimeline]);

  // Wenn keine Daten, zeige Platzhalter
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Lädt...
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Keine Daten verfügbar. Kaufe oder verkaufe Aktien, um die Performance zu sehen.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
        <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
        <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#1f2937' : '#fff',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px'
          }}
          formatter={(value) => [`€${value.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Gewinn']}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
