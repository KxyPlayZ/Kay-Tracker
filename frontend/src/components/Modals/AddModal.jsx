// frontend/src/components/Modals/AddModal.jsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AddModal = ({ show, onClose }) => {
  const { darkMode, depots, aktien, addDepot, buyAktie, sellAktie, importAktien } = useApp();
  const [addType, setAddType] = useState('depot');
  const [selectedAktie, setSelectedAktie] = useState(null);
  const [formData, setFormData] = useState({
    depot_id: depots.length > 0 ? depots[0].id : '',
    name: '',
    symbol: '',
    shares: '',
    price: '',
    category: 'Aktie',
    transaction_date: ''
  });

  if (!show) return null;

  const handleBuy = async (e) => {
    e.preventDefault();
    try {
      await buyAktie({
        depot_id: parseInt(formData.depot_id),
        name: formData.name,
        symbol: formData.symbol,
        shares: parseFloat(formData.shares),
        price: parseFloat(formData.price),
        category: formData.category,
        transaction_date: formData.transaction_date || null
      });
      
      setFormData({
        depot_id: depots[0]?.id || '',
        name: '',
        symbol: '',
        shares: '',
        price: '',
        category: 'Aktie',
        transaction_date: ''
      });
      
      alert('Kauf erfolgreich!');
      onClose();
    } catch (error) {
      alert('Fehler beim Kauf: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    try {
      const result = await sellAktie({
        aktie_id: parseInt(selectedAktie),
        shares: parseFloat(formData.shares),
        price: parseFloat(formData.price),
        transaction_date: formData.transaction_date || null
      });
      
      alert(`Verkauf erfolgreich! Gewinn: €${result.gewinn.toFixed(2)}`);
      setSelectedAktie(null);
      setFormData({ ...formData, shares: '', price: '', transaction_date: '' });
      onClose();
    } catch (error) {
      alert('Fehler beim Verkauf: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const aktienList = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const aktie = {};
          headers.forEach((header, index) => {
            aktie[header] = values[index];
          });
          
          aktienList.push({
            name: aktie.name || aktie.Name,
            symbol: aktie.symbol || aktie.Symbol,
            shares: parseFloat(aktie.shares || aktie.Anzahl),
            buy_price: parseFloat(aktie.buy_price || aktie.Kaufpreis),
            current_price: parseFloat(aktie.current_price || aktie.AktuellerPreis),
            category: aktie.category || aktie.Kategorie || 'Aktie'
          });
        }
        
        await importAktien(parseInt(formData.depot_id), aktienList);
        alert(`${aktienList.length} Aktien erfolgreich importiert!`);
        onClose();
      } catch (error) {
        alert('Fehler beim CSV-Import: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleJSONUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const aktienList = JSON.parse(event.target.result);
        await importAktien(parseInt(formData.depot_id), aktienList);
        alert(`${aktienList.length} Aktien erfolgreich importiert!`);
        onClose();
      } catch (error) {
        alert('Fehler beim JSON-Import: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  // Verfügbare Aktien für Verkauf
  const availableAktien = aktien.filter(a => parseFloat(a.current_shares || a.shares) > 0);

  const currentAktieData = selectedAktie ? aktien.find(a => a.id === parseInt(selectedAktie)) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Hinzufügen / Verkaufen</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setAddType('depot')}
            className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${
              addType === 'depot' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Depot
          </button>
          <button
            onClick={() => setAddType('buy')}
            className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${
              addType === 'buy' ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Kaufen
          </button>
          <button
            onClick={() => setAddType('sell')}
            className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${
              addType === 'sell' ? 'bg-red-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Verkaufen
          </button>
          <button
            onClick={() => setAddType('csv')}
            className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${
              addType === 'csv' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            CSV
          </button>
          <button
            onClick={() => setAddType('json')}
            className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${
              addType === 'json' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            JSON
          </button>
        </div>

        {addType === 'depot' ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const name = e.target.elements.depotName.value;
            const cashBestand = e.target.elements.cashBestand.value;
            try {
              await addDepot({ name, cash_bestand: parseFloat(cashBestand) });
              onClose();
            } catch (error) {
              alert('Fehler beim Erstellen des Depots: ' + error.message);
            }
          }} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Depot Name</label>
              <input
                type="text"
                name="depotName"
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="z.B. Trade Republic"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Cashbestand (€)</label>
              <input
                type="number"
                step="0.01"
                name="cashBestand"
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="5000.00"
                defaultValue="0"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors font-medium"
            >
              Depot erstellen
            </button>
          </form>
        ) : addType === 'buy' ? (
          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Depot</label>
              <select
                value={formData.depot_id}
                onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
              >
                {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="z.B. Porsche AG"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Symbol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="z.B. P911"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Anzahl</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  required
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Kategorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option>Aktie</option>
                  <option>ETF</option>
                  <option>Krypto</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Kaufpreis pro Stück (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="80.00"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Datum & Uhrzeit (optional)</label>
              <input
                type="datetime-local"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <p className="text-xs text-gray-500 mt-1">Leer lassen für aktuelles Datum/Uhrzeit</p>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium"
            >
              Kaufen
            </button>
          </form>
        ) : addType === 'sell' ? (
          <form onSubmit={handleSell} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Aktie auswählen</label>
              <select
                value={selectedAktie || ''}
                onChange={(e) => setSelectedAktie(e.target.value)}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
              >
                <option value="">-- Bitte wählen --</option>
                {availableAktien.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.symbol}) - {parseFloat(a.current_shares || a.shares).toFixed(2)} Stück
                  </option>
                ))}
              </select>
            </div>

            {currentAktieData && (
              <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm">Verfügbar: <strong>{parseFloat(currentAktieData.current_shares || currentAktieData.shares).toFixed(2)} Stück</strong></p>
                <p className="text-sm">Kaufpreis: €{parseFloat(currentAktieData.buy_price).toFixed(2)}</p>
              </div>
            )}
            
            <div>
              <label className="block mb-1 text-sm font-medium">Anzahl verkaufen</label>
              <input
                type="number"
                step="0.0001"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="10"
                max={currentAktieData ? parseFloat(currentAktieData.current_shares || currentAktieData.shares) : undefined}
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Verkaufspreis pro Stück (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="85.00"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Datum & Uhrzeit (optional)</label>
              <input
                type="datetime-local"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <p className="text-xs text-gray-500 mt-1">Leer lassen für aktuelles Datum/Uhrzeit</p>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors font-medium"
              disabled={!selectedAktie}
            >
              Verkaufen
            </button>
          </form>
        ) : addType === 'csv' ? (
          <div className="text-center py-8">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              CSV-Datei hochladen
            </p>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Format: name,symbol,shares,buy_price,current_price,category
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Depot auswählen</label>
              <select
                value={formData.depot_id}
                onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              JSON-Datei hochladen
            </p>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Format: Array von Objekten
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Depot auswählen</label>
              <select
                value={formData.depot_id}
                onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleJSONUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddModal;
