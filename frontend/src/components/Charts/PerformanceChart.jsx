// frontend/src/components/Charts/PerformanceChart.jsx
// Punkt 4: Chart vergrößert auf 400px Höhe statt 250px
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';

const PerformanceChart = ({ darkMode, color = '#3b82f6', depotId = null }) => {
  const { loadUserTimeline, loadDepotTimeline } = useApp();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        const timeline = depotId 
          ? await loadDepotTimeline(depotId)
          : await loadUserTimeline();
        
        if (!isMounted) return;
        
        if (timeline && Array.isArray(timeline) && timeline.length > 0) {
          const formatted = timeline.map(t => {
            const date = new Date(t.date);
            return {
              date: date.toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: 'short'
              }),
              value: parseFloat(t.kumulativer_gewinn || 0),
              fullDate: date
            };
          });
          
          setChartData(formatted);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Chart-Daten:', error);
        if (isMounted) setChartData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [depotId, loadUserTimeline, loadDepotTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Lädt...
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Keine Performance-Daten vorhanden
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Verkaufe Aktien, um die Performance zu sehen
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="date" 
          stroke={darkMode ? '#9ca3af' : '#6b7280'}
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke={darkMode ? '#9ca3af' : '#6b7280'}
          style={{ fontSize: '13px' }}
          tickFormatter={(value) => `€${value.toFixed(0)}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '14px'
          }}
          formatter={(value) => [`€${value.toFixed(2)}`, 'Gewinn']}
          labelStyle={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;