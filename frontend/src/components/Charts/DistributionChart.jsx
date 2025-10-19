// frontend/src/components/Charts/DistributionChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const DistributionChart = ({ data, darkMode }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width="50%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ percentage }) => `${percentage}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `€${value.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
            contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#fff',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="flex-1">{item.name}</span>
            <span className="font-semibold">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistributionChart;
