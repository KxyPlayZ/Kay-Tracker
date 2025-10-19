// frontend/src/App.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import UebersichtView from './components/Views/UebersichtView';
import DepotView from './components/Views/DepotView';
import MarktView from './components/Views/MarktView';
import EinstellungenView from './components/Views/EinstellungenView';
import AddModal from './components/Modals/AddModal';
import Login from './components/Auth/Login';
import './styles/App.css';

function App() {
  const { darkMode, user, loading, depots } = useApp();
  const [activeView, setActiveView] = useState('uebersicht');
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex">
        <Sidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          selectedDepot={selectedDepot}
          setSelectedDepot={setSelectedDepot}
        />

        <div className="flex-1">
          <Header activeView={activeView} selectedDepot={selectedDepot} />

          <main className="p-6">
            {activeView === 'uebersicht' && <UebersichtView />}
            {activeView === 'depots' && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Alle Depots</h3>
                <div className="grid grid-cols-2 gap-4">
                  {depots.map(depot => (
                    <div 
                      key={depot.id} 
                      className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => { setActiveView('depot'); setSelectedDepot(depot); }}
                    >
                      <h4 className="font-semibold text-lg">{depot.name}</h4>
                      <p className="text-2xl font-bold mt-2">€{parseFloat(depot.cash_bestand || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}</p>
                      <p className="text-sm text-gray-500 mt-1">Cashbestand</p>
                    </div>
                  ))}
                  {depots.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      Noch keine Depots vorhanden. Klicke auf das + um ein Depot zu erstellen!
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeView === 'depot' && selectedDepot && <DepotView depot={selectedDepot} />}
            {activeView === 'markt' && <MarktView />}
            {activeView === 'einstellungen' && <EinstellungenView />}
          </main>

          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            title="Hinzufügen"
          >
            <Plus size={24} />
          </button>

          <AddModal show={showAddModal} onClose={() => setShowAddModal(false)} />
        </div>
      </div>
    </div>
  );
}

export default App;
