// frontend/src/components/Layout/Header.jsx
import React from 'react';
import { LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header = ({ activeView, selectedDepot }) => {
  const { darkMode, user, logout } = useApp();

  const getTitle = () => {
    if (activeView === 'uebersicht') return 'Übersicht';
    if (activeView === 'depot') return selectedDepot?.name || 'Depot';
    if (activeView === 'markt') return 'Markt';
    if (activeView === 'einstellungen') return 'Einstellungen';
    return 'Dashboard';
  };

  return (
    <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex justify-between items-center`}>
      <h2 className="text-2xl font-semibold">{getTitle()}</h2>
      
      <div className="flex items-center gap-4">
        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
          {user?.username || 'Kays Portfolio'}
        </span>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
          {user?.username?.[0]?.toUpperCase() || 'K'}
        </div>
        <button
          onClick={logout}
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Abmelden"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
