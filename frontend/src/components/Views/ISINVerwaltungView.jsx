// frontend/src/components/Views/ISINVerwaltungView.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ISINVerwaltungView = () => {
  const { darkMode } = useApp();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    isin: '',
    symbol: '',
    name: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Lade alle Mappings
  const loadMappings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/isin-mapping`, getAuthHeader());
      setMappings(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der ISIN Mappings:', error);
      alert('Fehler beim Laden der ISIN Mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  // Neues Mapping hinzufügen
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/isin-mapping`,
        formData,
        getAuthHeader()
      );
      setFormData({ isin: '', symbol: '', name: '' });
      setShowAddForm(false);
      loadMappings();
      alert('ISIN Mapping erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.error || error.message));
    }
  };

  // Mapping aktualisieren
  const handleUpdate = async (id, data) => {
    try {
      await axios.put(
        `${API_URL}/isin-mapping/${id}`,
        data,
        getAuthHeader()
      );
      setEditingId(null);
      loadMappings();
      alert('ISIN Mapping aktualisiert!');
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.error || error.message));
    }
  };

  // Mapping löschen
  const handleDelete = async (id) => {
    if (!confirm('Möchtest du dieses ISIN Mapping wirklich löschen?')) return;
    
    try {
      await axios.delete(
        `${API_URL}/isin-mapping/${id}`,
        getAuthHeader()
      );
      loadMappings();
      alert('ISIN Mapping gelöscht!');
    } catch (error) {
      alert('Fehler: ' + (error.response?.data?.error || error.message));
    }
  };

  // Filterfunktion für die Suche
  const filteredMappings = mappings.filter((mapping) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      mapping.isin.toLowerCase().includes(search) ||
      mapping.symbol.toLowerCase().includes(search) ||
      (mapping.name && mapping.name.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ISIN Verwaltung</h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Verwalte deine ISIN zu Symbol Zuordnungen für den CSV-Import
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          {showAddForm ? 'Abbrechen' : 'Neue ISIN'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Neue ISIN hinzufügen</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">ISIN</label>
              <input
                type="text"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="DE0005140008"
                required
                maxLength="12"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Symbol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="DBK.DE"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Name (optional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Deutsche Bank AG"
              />
            </div>
            <div className="col-span-3">
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mappings Table */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Gespeicherte ISIN Mappings ({filteredMappings.length})
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suche nach ISIN, Symbol oder Name..."
              className={`w-80 pl-4 pr-4 py-2 rounded border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Lädt...</div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Noch keine ISIN Mappings vorhanden. Füge welche hinzu für den CSV-Import!
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Keine Ergebnisse für "{searchTerm}" gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left">ISIN</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Erstellt am</th>
                  <th className="px-4 py-3 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr
                    key={mapping.id}
                    className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}
                  >
                    <td className="px-4 py-3 font-mono">{mapping.isin}</td>
                    <td className="px-4 py-3">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          defaultValue={mapping.symbol}
                          id={`symbol-${mapping.id}`}
                          className={`w-full p-1 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      ) : (
                        <span className="font-semibold">{mapping.symbol}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          defaultValue={mapping.name || ''}
                          id={`name-${mapping.id}`}
                          className={`w-full p-1 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      ) : (
                        mapping.name || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(mapping.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {editingId === mapping.id ? (
                          <>
                            <button
                              onClick={() => {
                                const symbol = document.getElementById(`symbol-${mapping.id}`).value;
                                const name = document.getElementById(`name-${mapping.id}`).value;
                                handleUpdate(mapping.id, { symbol, name });
                              }}
                              className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                              title="Speichern"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Abbrechen"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingId(mapping.id)}
                              className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(mapping.id)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                              title="Löschen"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-4 rounded-lg`}>
        <h4 className="font-semibold mb-2">💡 Wie funktioniert es?</h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Beim CSV-Import wird zuerst hier nach der ISIN gesucht</li>
          <li>Wenn die ISIN gefunden wird, wird das Symbol automatisch verwendet</li>
          <li>Wenn die ISIN NICHT gefunden wird, wirst du aufgefordert sie hier einzutragen</li>
          <li>Du kannst Mappings jederzeit manuell hinzufügen, bearbeiten oder löschen</li>
        </ul>
      </div>
    </div>
  );
};

export default ISINVerwaltungView;
