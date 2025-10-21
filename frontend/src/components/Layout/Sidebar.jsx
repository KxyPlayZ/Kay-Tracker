// frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { TrendingUp, Settings, BarChart3, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ activeView, setActiveView, selectedDepot, setSelectedDepot }) => {
  const { darkMode, depots } = useApp();
  
  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} min-h-screen p-6 shadow-lg`}>
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp size={32} className="text-blue-500" />
        <h1 className="text-xl font-bold">Aktien Tracker</h1>
      </div>
      
      <nav className="space-y-2">
        <button
          onClick={() => { setActiveView('uebersicht'); setSelectedDepot(null); }}
          className={`w-full text-left px-4 py-2 rounded transition-colors ${
            activeView === 'uebersicht' ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          Übersicht
        </button>
        
        <button
          onClick={() => { setActiveView('depots'); setSelectedDepot(null); }}
          className={`w-full text-left px-4 py-2 rounded transition-colors ${
            activeView === 'depots' && !selectedDepot ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          Depots
        </button>
        
        <div className="pl-4 space-y-1">
          {depots.map(depot => (
            <button
              key={depot.id}
              onClick={() => { setActiveView('depot'); setSelectedDepot(depot); }}
              className={`w-full text-left px-4 py-2 rounded transition-colors text-sm ${
                selectedDepot?.id === depot.id ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {depot.name}
            </button>
          ))}
        </div>
        
        {/* NEUER MENÜPUNKT: ISIN Verwaltung */}
        <button
          onClick={() => { setActiveView('isin-verwaltung'); setSelectedDepot(null); }}
          className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
            activeView === 'isin-verwaltung' ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <Database size={18} />
          ISIN Verwaltung
        </button>
        
        <button
          onClick={() => { setActiveView('markt'); setSelectedDepot(null); }}
          className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
            activeView === 'markt' ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={18} />
          Markt
        </button>
        
        <button
          onClick={() => { setActiveView('einstellungen'); setSelectedDepot(null); }}
          className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-2 ${
            activeView === 'einstellungen' ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <Settings size={18} />
          Einstellungen
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;