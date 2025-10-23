// frontend/src/components/Views/EinstellungenView.jsx
import React, { useState } from 'react';
import { Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';

const EinstellungenView = () => {
  const { darkMode, setDarkMode, depots, deleteDepot, clearDepotData, clearAllUserData } = useApp();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [selectedDepot, setSelectedDepot] = useState(null);

  const handleDeleteDepot = async () => {
    try {
      await deleteDepot(selectedDepot);
      toast.success('✅ Depot erfolgreich gelöscht!');
      setShowDeleteModal(false);
      setSelectedDepot(null);
    } catch (error) {
      toast.error('❌ Fehler: ' + error.message);
    }
  };

  const handleClearDepotData = async () => {
    try {
      const result = await clearDepotData(selectedDepot);
      toast.success(`✅ ${result.deleted_count} Aktien wurden aus dem Depot gelöscht!`);
      setShowDeleteModal(false);
    } catch (error) {
      toast.error('❌ Fehler: ' + error.message);
    }
  };

  const handleClearAllData = async () => {
    try {
      const result = await clearAllUserData();
      toast.success(`✅ ${result.deleted_depots} Depots und ${result.deleted_aktien} Aktien wurden gelöscht!`);
      setShowDeleteModal(false);
    } catch (error) {
      toast.error('❌ Fehler: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-6">Einstellungen</h3>
        
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-medium">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                darkMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                darkMode ? 'transform translate-x-7' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Daten Verwaltung */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trash2 size={20} className="text-red-500" />
          Daten Verwaltung
        </h3>

        <div className="space-y-3">
          {/* Depot-Daten löschen */}
          <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <h4 className="font-medium mb-2">Depot-Daten löschen</h4>
            <p className="text-sm text-gray-500 mb-3">Lösche alle Aktien aus einem bestimmten Depot</p>
            <select
              onChange={(e) => setSelectedDepot(parseInt(e.target.value))}
              className={`w-full p-2 rounded border mb-2 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            >
              <option value="">-- Depot auswählen --</option>
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!selectedDepot) {
                  toast.warning('⚠️ Bitte wähle ein Depot aus!');
                  return;
                }
                setDeleteType('clearDepot');
                setShowDeleteModal(true);
              }}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
            >
              Depot-Aktien löschen
            </button>
          </div>

          {/* Depot komplett löschen */}
          <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <h4 className="font-medium mb-2">Depot komplett löschen</h4>
            <p className="text-sm text-gray-500 mb-3">Lösche das gesamte Depot inklusive aller Aktien</p>
            <button
              onClick={() => {
                if (!selectedDepot) {
                  toast.warning('⚠️ Bitte wähle ein Depot aus (oben)!');
                  return;
                }
                setDeleteType('deleteDepot');
                setShowDeleteModal(true);
              }}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
            >
              Depot löschen
            </button>
          </div>

          {/* Alle Daten löschen */}
          <div className={`p-4 ${darkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'} rounded-lg border-2 border-red-500`}>
            <h4 className="font-medium mb-2 text-red-500 flex items-center gap-2">
              <AlertTriangle size={20} />
              Alle Daten löschen
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Lösche alle Depots und Aktien. Dein Account bleibt bestehen.
            </p>
            <button
              onClick={() => {
                setDeleteType('clearAll');
                setShowDeleteModal(true);
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors font-semibold"
            >
              ALLE DATEN LÖSCHEN
            </button>
          </div>
        </div>
      </div>

      {/* Bestätigungs-Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={32} className="text-red-500" />
              <h3 className="text-xl font-bold">Bestätigung erforderlich</h3>
            </div>
            
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {deleteType === 'clearDepot' && 'Möchtest du wirklich alle Aktien aus diesem Depot löschen?'}
              {deleteType === 'deleteDepot' && 'Möchtest du wirklich das gesamte Depot inklusive aller Aktien löschen?'}
              {deleteType === 'clearAll' && 'Möchtest du wirklich ALLE Depots und Aktien löschen? Diese Aktion kann nicht rückgängig gemacht werden!'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (deleteType === 'clearDepot') handleClearDepotData();
                  else if (deleteType === 'deleteDepot') handleDeleteDepot();
                  else if (deleteType === 'clearAll') handleClearAllData();
                }}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors font-semibold"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EinstellungenView;