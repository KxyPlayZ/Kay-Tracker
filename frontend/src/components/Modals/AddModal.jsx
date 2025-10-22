// frontend/src/components/Modals/AddModal.jsx
import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { addDepot, buyAktie, sellAktie, importJustTradeCSV } from '../../services/api';
import { useApp } from '../../context/AppContext';

const AddModal = ({ onClose, depots, aktien, darkMode, currentDepot }) => {
  const { loadData } = useApp(); // loadData aus Context holen!
  const [addType, setAddType] = useState('depot');
  const [selectedAktie, setSelectedAktie] = useState(null);
  const [formData, setFormData] = useState({
    depot_id: '',
    name: '',
    symbol: '',
    shares: '',
    price: '',
    buy_price: '',
    current_price: '',
    category: 'Aktie',
    transaction_date: '',
    cash_bestand: '10000'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wenn wir in einem Depot-Fenster sind, verwende currentDepot
    if (currentDepot && currentDepot.id) {
      setFormData(prev => ({ ...prev, depot_id: currentDepot.id }));
    } else if (depots && depots.length > 0 && !formData.depot_id) {
      setFormData(prev => ({ ...prev, depot_id: depots[0].id }));
    }
  }, [depots, currentDepot]);

  const safeDepots = depots || [];
  const safeAktien = aktien || [];

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDepotSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDepot({
        name: formData.name,
        cash_bestand: parseFloat(formData.cash_bestand)
      });
      alert('Depot erfolgreich erstellt!');
      setFormData({ ...formData, name: '', cash_bestand: '10000' });
      await loadData();
      onClose();
    } catch (error) {
      alert('Fehler beim Erstellen des Depots: ' + (error.response?.data?.error || error.message));
    }
  };

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
      
      alert('Kauf erfolgreich!');
      setFormData({ ...formData, name: '', symbol: '', shares: '', price: '', transaction_date: '' });
      await loadData();
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
      await loadData();
      onClose();
    } catch (error) {
      alert('Fehler beim Verkauf: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleJustTradeCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
        
        console.log('CSV Headers:', headers);
        
        const isinIndex = headers.findIndex(h => h === 'ISIN');
        const nameIndex = headers.findIndex(h => h === 'Produktname');
        const sharesIndex = headers.findIndex(h => h === 'Anzahl (Ausführung)');
        const priceIndex = headers.findIndex(h => h === 'Kurs (Ausführung)');
        const dateIndex = headers.findIndex(h => h === 'Datum (Ausführung)');
        const timeIndex = headers.findIndex(h => h === 'Uhrzeit (Ausführung)');
        const richtungIndex = headers.findIndex(h => h === 'Richtung');

        console.log('Gefundene Indizes:', { isin: isinIndex, name: nameIndex, shares: sharesIndex, price: priceIndex, date: dateIndex, time: timeIndex, richtung: richtungIndex });

        if (isinIndex === -1 || sharesIndex === -1 || priceIndex === -1) {
          alert('CSV-Format ungültig. Ist das eine echte JustTrade CSV-Datei?');
          setLoading(false);
          return;
        }

        const aktienList = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
          const richtung = richtungIndex !== -1 ? values[richtungIndex] : '';
          const isBuy = richtung.toLowerCase() === 'kauf';
          
          const isin = values[isinIndex];
          const name = nameIndex !== -1 ? values[nameIndex] : '';
          const shares = values[sharesIndex]?.replace(',', '.');
          const price = values[priceIndex]?.replace(',', '.');
          
          let transaction_date = null;
          if (dateIndex !== -1 && values[dateIndex]) {
            const germanDate = values[dateIndex];
            const germanTime = timeIndex !== -1 ? values[timeIndex] : '';
            
            // Datum parsen: "22.10.2025" -> "2025-10-22"
            const parts = germanDate.split('.');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              
              // Uhrzeit hinzufügen wenn vorhanden: "16:51:41"
              if (germanTime) {
                transaction_date = `${formattedDate}T${germanTime}`;
              } else {
                transaction_date = formattedDate;
              }
            }
          }
          
          console.log(`Zeile ${i}: ${isin} - ${name} - ${shares} @ ${price} [${isBuy ? 'KAUF' : 'VERKAUF'}]`);

          aktienList.push({
            isin,
            name,
            shares: parseFloat(shares),
            price: parseFloat(price),
            transaction_date,
            transaction_type: isBuy ? 'BUY' : 'SELL',
            category: 'Aktie'
          });
        }

        if (aktienList.length === 0) {
          alert('Keine gültigen Transaktionen in der CSV gefunden');
          setLoading(false);
          return;
        }

        const buyCount = aktienList.filter(a => a.transaction_type === 'BUY').length;
        const sellCount = aktienList.filter(a => a.transaction_type === 'SELL').length;
        
        console.log(`Importiere ${aktienList.length} Transaktionen: ${buyCount} Käufe, ${sellCount} Verkäufe`);

        const result = await importJustTradeCSV(parseInt(formData.depot_id), aktienList);
        
        // ÄNDERUNG 4: Import abbrechen wenn ISINs fehlen
        if (result.errors && result.errors.length > 0) {
          const missingMappings = result.errors.filter(e => e.needsMapping);
          
          if (missingMappings.length > 0) {
            // Import wurde abgebrochen weil ISINs fehlen
            let message = `⚠️ CSV-Import abgebrochen!\n\n`;
            message += `Es fehlen Symbole für ${missingMappings.length} ISIN(s):\n\n`;
            
            missingMappings.slice(0, 8).forEach(err => {
              message += `• ${err.isin} - ${err.name}\n`;
            });
            
            if (missingMappings.length > 8) {
              message += `\n... und ${missingMappings.length - 8} weitere\n`;
            }
            
            message += `\n👉 Bitte gehe zu "ISIN Verwaltung" und trage die Symbole nach.\n`;
            message += `Dann versuche den Import erneut.`;
            
            alert(message);
            setLoading(false);
            // Modal bleibt offen damit User nochmal importieren kann
            return;
          }
        }
        
        // Erfolgreicher Import
        let message = `✅ Import erfolgreich!\n\n`;
        message += `✓ Transaktionen verarbeitet: ${buyCount} Käufe + ${sellCount} Verkäufe\n`;
        message += `✓ Erfolgreich importiert: ${result.imported || result.importedAktien?.length || 0} Aktien\n`;

        alert(message);
        setLoading(false);
        
        // Daten neu laden ohne Page Reload
        await loadData();
        onClose();
        
      } catch (error) {
        console.error('Import Fehler:', error);
        alert('Fehler beim Import: ' + (error.response?.data?.error || error.message));
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      alert('Fehler beim Lesen der Datei');
      setLoading(false);
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const availableAktien = safeAktien.filter(a => parseFloat(a.current_shares || a.shares) > 0);
  const currentAktieData = selectedAktie ? safeAktien.find(a => a.id === parseInt(selectedAktie)) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Hinzufügen</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setAddType('depot')} 
            className={`px-4 py-2 rounded transition-colors ${
              addType === 'depot' 
                ? 'bg-blue-500 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Depot
          </button>
          <button 
            onClick={() => setAddType('buy')} 
            className={`px-4 py-2 rounded transition-colors ${
              addType === 'buy' 
                ? 'bg-blue-500 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Kauf
          </button>
          <button 
            onClick={() => setAddType('sell')} 
            className={`px-4 py-2 rounded transition-colors ${
              addType === 'sell' 
                ? 'bg-blue-500 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Verkauf
          </button>
          <button 
            onClick={() => setAddType('csv')} 
            className={`px-4 py-2 rounded transition-colors ${
              addType === 'csv' 
                ? 'bg-blue-500 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            CSV Import
          </button>
        </div>

        {/* Depot Form */}
        {addType === 'depot' ? (
          <form onSubmit={handleDepotSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Depot Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                required 
                placeholder="z.B. Haupt-Depot" 
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Cashbestand (€)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.cash_bestand} 
                onChange={(e) => setFormData({ ...formData, cash_bestand: e.target.value })} 
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                required 
                placeholder="10000" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium"
            >
              Depot erstellen
            </button>
          </form>

        // Buy Form
        ) : addType === 'buy' ? (
          <form onSubmit={handleBuy} className="space-y-4">
            {safeDepots.length === 0 ? (
              <div className="text-red-500 py-4">Bitte erstelle zuerst ein Depot!</div>
            ) : (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Depot</label>
                  <select 
                    value={formData.depot_id} 
                    onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required
                  >
                    {safeDepots.map(depot => (
                      <option key={depot.id} value={depot.id}>{depot.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Aktien Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="z.B. Apple Inc." 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Symbol</label>
                  <input 
                    type="text" 
                    value={formData.symbol} 
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="z.B. AAPL" 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Anzahl</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.shares} 
                    onChange={(e) => setFormData({ ...formData, shares: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="10" 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Kaufpreis pro Aktie (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="150.00" 
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
              </>
            )}
          </form>

        // Sell Form
        ) : addType === 'sell' ? (
          <form onSubmit={handleSell} className="space-y-4">
            {availableAktien.length === 0 ? (
              <div className="text-red-500 py-4">Keine Aktien zum Verkaufen vorhanden!</div>
            ) : (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Aktie auswählen</label>
                  <select 
                    value={selectedAktie || ''} 
                    onChange={(e) => setSelectedAktie(e.target.value)} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required
                  >
                    <option value="">-- Aktie wählen --</option>
                    {availableAktien.map(aktie => (
                      <option key={aktie.id} value={aktie.id}>
                        {aktie.name} ({aktie.symbol}) - {parseFloat(aktie.current_shares || aktie.shares).toFixed(2)} Stück
                      </option>
                    ))}
                  </select>
                </div>
                {currentAktieData && (
                  <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-sm"><strong>Verfügbar:</strong> {parseFloat(currentAktieData.current_shares || currentAktieData.shares).toFixed(2)} Stück</p>
                    <p className="text-sm"><strong>Kaufpreis:</strong> €{parseFloat(currentAktieData.buy_price).toFixed(2)}</p>
                    <p className="text-sm"><strong>Aktueller Preis:</strong> €{parseFloat(currentAktieData.current_price).toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <label className="block mb-1 text-sm font-medium">Anzahl verkaufen</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.shares} 
                    onChange={(e) => setFormData({ ...formData, shares: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="5" 
                    max={currentAktieData ? parseFloat(currentAktieData.current_shares || currentAktieData.shares) : undefined} 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Verkaufspreis pro Aktie (€)</label>
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
              </>
            )}
          </form>

        // CSV Import
        ) : addType === 'csv' ? (
          <div className="text-center py-8">
            {safeDepots.length === 0 ? (
              <div className="text-red-500 py-4">Bitte erstelle zuerst ein Depot!</div>
            ) : (
              <>
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className={`mb-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  JustTrade CSV-Datei hochladen
                </p>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  ⚠️ Aktuell nur für JustTrade CSV-Exporte
                </p>
                {/* ÄNDERUNG 2: Hinweise Text verringert - 3 Punkte entfernt */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-left">
                  <p className="font-medium mb-1">ℹ️ Hinweise:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>CSV funktioniert nur mit JustTrade Format</li>
                    <li>Beim Re-Import werden alte CSV-Daten überschrieben</li>
                    <li>Manuelle Käufe/Verkäufe bleiben erhalten</li>
                    <li>Import kann einige Sekunden dauern</li>
                  </ul>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">Depot auswählen</label>
                  <select 
                    value={formData.depot_id} 
                    onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })} 
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required
                  >
                    {safeDepots.map(depot => (
                      <option key={depot.id} value={depot.id}>{depot.name}</option>
                    ))}
                  </select>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleJustTradeCSVUpload} 
                  className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                  disabled={loading} 
                />
                {loading && (
                  <div className="mt-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm">Importiere Daten...</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddModal;