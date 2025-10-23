// frontend/src/components/Modals/AddModal.jsx - KOMPLETT ÜBERARBEITET
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { addDepot, buyAktie, sellAktie, importJustTradeCSV } from '../../services/api';
import CSVPreviewModal from './CSVPreviewModal';

const AddModal = ({ onClose, depots, aktien, darkMode, toast }) => {
  const { loadData } = useApp();
  const [addType, setAddType] = useState('depot');
  const [selectedAktie, setSelectedAktie] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // CSV Preview States
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [importMode, setImportMode] = useState('replace');
  
  const [formData, setFormData] = useState({
    depot_id: depots.length > 0 ? depots[0].id : '',
    name: '',
    symbol: '',
    shares: '',
    price: '',
    cash_bestand: '',
    category: 'Aktie',
    transaction_date: ''
  });

  const safeDepots = Array.isArray(depots) ? depots : [];
  const safeAktien = Array.isArray(aktien) ? aktien : [];

  const handleAddDepot = async (e) => {
    e.preventDefault();
    try {
      await addDepot({
        name: formData.name,
        cash_bestand: parseFloat(formData.cash_bestand) || 0
      });
      
      toast.success('✅ Depot erfolgreich erstellt!');
      setFormData({ ...formData, name: '', cash_bestand: '' });
      await loadData();
      onClose();
    } catch (error) {
      toast.error('❌ Fehler beim Erstellen: ' + (error.response?.data?.error || error.message));
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
      
      toast.success('✅ Kauf erfolgreich durchgeführt!');
      setFormData({ ...formData, name: '', symbol: '', shares: '', price: '', transaction_date: '' });
      await loadData();
      onClose();
    } catch (error) {
      toast.error('❌ Fehler beim Kauf: ' + (error.response?.data?.error || error.message));
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
      
      toast.success(`✅ Verkauf erfolgreich! Gewinn: €${result.gewinn.toFixed(2)}`);
      setSelectedAktie(null);
      setFormData({ ...formData, shares: '', price: '', transaction_date: '' });
      await loadData();
      onClose();
    } catch (error) {
      toast.error('❌ Fehler beim Verkauf: ' + (error.response?.data?.error || error.message));
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

        if (isinIndex === -1 || sharesIndex === -1 || priceIndex === -1) {
          toast.error('❌ CSV-Format ungültig. Ist das eine echte JustTrade CSV-Datei?');
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
          
          let transaction_date = new Date().toISOString();
          if (dateIndex !== -1 && timeIndex !== -1) {
            const dateStr = values[dateIndex];
            const timeStr = values[timeIndex];
            if (dateStr && timeStr) {
              const [day, month, year] = dateStr.split('.');
              transaction_date = new Date(`${year}-${month}-${day}T${timeStr}`).toISOString();
            }
          }

          if (isin && shares && price) {
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
        }

        if (aktienList.length === 0) {
          toast.warning('⚠️ Keine gültigen Transaktionen in der CSV gefunden');
          setLoading(false);
          return;
        }

        // Zeige Preview-Modal statt direkt zu importieren
        setParsedTransactions(aktienList);
        setShowCSVPreview(true);
        setLoading(false);
        
      } catch (error) {
        console.error('CSV Parse Fehler:', error);
        toast.error('❌ Fehler beim Lesen der CSV: ' + error.message);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('❌ Fehler beim Lesen der Datei');
      setLoading(false);
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = async (selectedTransactions) => {
    setShowCSVPreview(false);
    setLoading(true);
    
    try {
      const buyCount = selectedTransactions.filter(a => a.transaction_type === 'BUY').length;
      const sellCount = selectedTransactions.filter(a => a.transaction_type === 'SELL').length;
      
      console.log(`Importiere ${selectedTransactions.length} Transaktionen im ${importMode}-Modus: ${buyCount} Käufe, ${sellCount} Verkäufe`);

      const result = await importJustTradeCSV(
        parseInt(formData.depot_id), 
        selectedTransactions,
        importMode  // 'replace' oder 'add'
      );
      
      // Prüfe auf fehlende ISINs
      if (result.errors && result.errors.length > 0) {
        const missingMappings = result.errors.filter(e => e.needsMapping);
        
        if (missingMappings.length > 0) {
          let message = `Es fehlen Symbole für ${missingMappings.length} ISIN(s):\n\n`;
          missingMappings.slice(0, 5).forEach(err => {
            message += `• ${err.isin} - ${err.name}\n`;
          });
          if (missingMappings.length > 5) {
            message += `\n... und ${missingMappings.length - 5} weitere`;
          }
          message += `\n\nBitte gehe zu "ISIN Verwaltung" und trage die Symbole nach.`;
          
          toast.warning(message, 8000);
          setLoading(false);
          return;
        }
      }
      
      // Erfolgreicher Import
      const modeText = importMode === 'replace' ? 'ersetzt' : 'hinzugefügt';
      let message = `✅ Import erfolgreich!\n\n`;
      message += `Modus: ${modeText}\n`;
      message += `Transaktionen: ${buyCount} Käufe + ${sellCount} Verkäufe\n`;
      message += `Importiert: ${result.imported || result.importedAktien?.length || 0} Aktien`;

      toast.success(message, 6000);
      setLoading(false);
      
      await loadData();
      onClose();
      
    } catch (error) {
      console.error('Import Fehler:', error);
      toast.error('❌ Fehler beim Import: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const availableAktien = safeAktien.filter(a => parseFloat(a.current_shares || a.shares) > 0);
  const currentAktieData = selectedAktie 
    ? availableAktien.find(a => a.id === parseInt(selectedAktie))
    : null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Hinzufügen</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAddType('depot')}
              className={`flex-1 py-2 rounded transition-colors ${
                addType === 'depot'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              Depot
            </button>
            <button
              onClick={() => setAddType('buy')}
              className={`flex-1 py-2 rounded transition-colors ${
                addType === 'buy'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              Kaufen
            </button>
            <button
              onClick={() => setAddType('sell')}
              className={`flex-1 py-2 rounded transition-colors ${
                addType === 'sell'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              Verkaufen
            </button>
            <button
              onClick={() => setAddType('csv')}
              className={`flex-1 py-2 rounded transition-colors ${
                addType === 'csv'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              CSV
            </button>
          </div>

          {/* Depot Form */}
          {addType === 'depot' ? (
            <form onSubmit={handleAddDepot} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Depot Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  required
                  placeholder="Mein Depot"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Anfangskapital (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cash_bestand}
                  onChange={(e) => setFormData({ ...formData, cash_bestand: e.target.value })}
                  className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="10000.00"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors font-medium"
              >
                Depot erstellen
              </button>
            </form>

          // Buy Form
          ) : addType === 'buy' ? (
            <form onSubmit={handleBuy} className="space-y-4">
              {safeDepots.length === 0 ? (
                <div className="text-red-500 py-4 text-center">Bitte erstelle zuerst ein Depot!</div>
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
                    <label className="block mb-1 text-sm font-medium">Aktienname</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                      placeholder="Apple Inc."
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
                      placeholder="AAPL"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Anzahl Aktien</label>
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
                <div className="text-red-500 py-4 text-center">Keine Aktien zum Verkaufen verfügbar!</div>
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
                          {aktie.name} ({aktie.symbol}) - {parseFloat(aktie.current_shares || aktie.shares).toFixed(2)} Stk.
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentAktieData && (
                    <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className="text-sm">
                        <strong>Verfügbar:</strong> {parseFloat(currentAktieData.current_shares || currentAktieData.shares).toFixed(2)} Aktien
                      </p>
                      <p className="text-sm">
                        <strong>Ø Kaufpreis:</strong> €{parseFloat(currentAktieData.buy_price).toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <strong>Aktueller Preis:</strong> €{parseFloat(currentAktieData.current_price).toFixed(2)}
                      </p>
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
          ) : (
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
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-left">
                    <p className="font-medium mb-1">ℹ️ Hinweise:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>CSV funktioniert nur mit JustTrade Format</li>
                      <li>Nach dem Upload kannst du Aktivitäten auswählen</li>
                      <li>Wähle zwischen Ersetzen oder Hinzufügen</li>
                      <li>Manuelle Käufe/Verkäufe bleiben immer erhalten</li>
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
                      <p className="mt-2 text-sm">Lese CSV-Datei...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSV Preview Modal */}
      {showCSVPreview && (
        <CSVPreviewModal
          show={showCSVPreview}
          onClose={() => setShowCSVPreview(false)}
          transactions={parsedTransactions}
          onConfirm={handleConfirmImport}
          darkMode={darkMode}
          importMode={importMode}
          setImportMode={setImportMode}
        />
      )}
    </>
  );
};

export default AddModal;