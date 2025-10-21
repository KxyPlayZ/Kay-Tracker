// frontend/src/components/Modals/AddModal.jsx
import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { addDepot, buyAktie, sellAktie, importAktien, importJustTradeCSV } from '../../services/api';

const AddModal = ({ onClose, depots, aktien, darkMode }) => {
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
    transaction_date: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (depots && depots.length > 0 && !formData.depot_id) {
      setFormData(prev => ({ ...prev, depot_id: depots[0].id }));
    }
  }, [depots]);

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
        const richtungIndex = headers.findIndex(h => h === 'Richtung');

        console.log('Gefundene Indizes:', { isin: isinIndex, name: nameIndex, shares: sharesIndex, price: priceIndex, date: dateIndex, richtung: richtungIndex });

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
            const parts = germanDate.split('.');
            if (parts.length === 3) {
              transaction_date = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          
          if (!isin || !shares || !price) {
            console.warn(`Zeile ${i+1} übersprungen: Fehlende Daten`);
            continue;
          }

          console.log(`Zeile ${i+1}: ${name} (${isin}) - ${shares} Stück @ ${price}€ [${isBuy ? 'KAUF' : 'VERKAUF'}]`);

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
        
        let message = `Import abgeschlossen!\n\n`;
        message += `✓ Transaktionen verarbeitet: ${buyCount} Käufe + ${sellCount} Verkäufe\n`;
        message += `✓ Erfolgreich importiert: ${result.imported || result.importedAktien?.length || 0} Aktien\n`;

        if (result.errors && result.errors.length > 0) {
          const missingMappings = result.errors.filter(e => e.needsMapping);
          const otherErrors = result.errors.filter(e => !e.needsMapping);
          
          if (missingMappings.length > 0) {
            const autoAdded = missingMappings.filter(e => e.autoAdded);
            
            if (autoAdded.length > 0) {
              message += `\n✅ ${autoAdded.length} ISINs wurden automatisch hinzugefügt!\n`;
            }
            
            message += `\n⚠ Bitte trage die Symbole nach:\n\n`;
            missingMappings.slice(0, 8).forEach(err => {
              message += `• ${err.isin} - ${err.name}\n`;
            });
            
            if (missingMappings.length > 8) {
              message += `\n... und ${missingMappings.length - 8} weitere\n`;
            }
            
            message += `\n👉 Gehe zu "ISIN Verwaltung" und trage die Symbole ein.\n`;
          }
          
          if (otherErrors.length > 0) {
            message += `\n❌ Andere Fehler (${otherErrors.length}):\n`;
            otherErrors.slice(0, 3).forEach(err => {
              message += `- ${err.isin}: ${err.error}\n`;
            });
          }
        }

        alert(message);
        setLoading(false);
        window.location.reload();
        
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

  const availableAktien = safeAktien.filter(a => parseFloat(a.current_shares || a.shares) > 0);
  const currentAktieData = selectedAktie ? safeAktien.find(a => a.id === parseInt(selectedAktie)) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Hinzufügen / Verkaufen</h3>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} type="button" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setAddType('depot')} className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${addType === 'depot' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Depot</button>
          <button onClick={() => setAddType('buy')} className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${addType === 'buy' ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Kaufen</button>
          <button onClick={() => setAddType('sell')} className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${addType === 'sell' ? 'bg-red-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Verkaufen</button>
          <button onClick={() => setAddType('csv')} className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${addType === 'csv' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>CSV</button>
          <button onClick={() => setAddType('json')} className={`flex-1 py-2 px-3 rounded transition-colors text-sm ${addType === 'json' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>JSON</button>
        </div>

        {addType === 'depot' ? (
          <form onSubmit={async (e) => { e.preventDefault(); const name = e.target.elements.depotName.value; const cashBestand = e.target.elements.cashBestand.value; try { await addDepot({ name, cash_bestand: parseFloat(cashBestand) }); alert('Depot erfolgreich erstellt!'); window.location.reload(); } catch (error) { alert('Fehler beim Erstellen des Depots: ' + error.message); } }} className="space-y-4">
            <div><label className="block mb-1 text-sm font-medium">Depot Name</label><input type="text" name="depotName" className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="z.B. JustTrade" /></div>
            <div><label className="block mb-1 text-sm font-medium">Cashbestand (€)</label><input type="number" step="0.01" name="cashBestand" className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="5000.00" defaultValue="0" /></div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors font-medium">Depot erstellen</button>
          </form>
        ) : addType === 'buy' ? (
          <form onSubmit={handleBuy} className="space-y-4">
            {safeDepots.length === 0 ? (<div className="text-center py-4 text-red-500">Bitte erstelle zuerst ein Depot!</div>) : (<>
              <div><label className="block mb-1 text-sm font-medium">Depot</label><select value={formData.depot_id} onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>{safeDepots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="block mb-1 text-sm font-medium">Aktienname</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="z.B. Apple Inc." /></div>
              <div><label className="block mb-1 text-sm font-medium">Symbol</label><input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="AAPL" /></div>
              <div><label className="block mb-1 text-sm font-medium">Anzahl Aktien</label><input type="number" step="0.0001" value={formData.shares} onChange={(e) => setFormData({ ...formData, shares: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="10" /></div>
              <div><label className="block mb-1 text-sm font-medium">Kaufpreis pro Aktie (€)</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="150.00" /></div>
              <div><label className="block mb-1 text-sm font-medium">Kategorie</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}><option value="Aktie">Aktie</option><option value="ETF">ETF</option><option value="Krypto">Krypto</option><option value="Rohstoff">Rohstoff</option></select></div>
              <div><label className="block mb-1 text-sm font-medium">Datum & Uhrzeit (optional)</label><input type="datetime-local" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} /><p className="text-xs text-gray-500 mt-1">Leer lassen für aktuelles Datum/Uhrzeit</p></div>
              <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium">Kaufen</button>
            </>)}
          </form>
        ) : addType === 'sell' ? (
          <form onSubmit={handleSell} className="space-y-4">
            {availableAktien.length === 0 ? (<div className="text-center py-4 text-red-500">Keine Aktien zum Verkaufen vorhanden!</div>) : (<>
              <div><label className="block mb-1 text-sm font-medium">Aktie auswählen</label><select value={selectedAktie || ''} onChange={(e) => setSelectedAktie(e.target.value)} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required><option value="">-- Aktie wählen --</option>{availableAktien.map(a => (<option key={a.id} value={a.id}>{a.name} ({a.symbol}) - {parseFloat(a.current_shares || a.shares).toFixed(2)} Stück</option>))}</select></div>
              {currentAktieData && (<div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><p className="text-sm"><strong>Verfügbar:</strong> {parseFloat(currentAktieData.current_shares || currentAktieData.shares).toFixed(2)} Stück</p><p className="text-sm"><strong>Ø Kaufpreis:</strong> €{parseFloat(currentAktieData.buy_price).toFixed(2)}</p></div>)}
              <div><label className="block mb-1 text-sm font-medium">Anzahl verkaufen</label><input type="number" step="0.0001" value={formData.shares} onChange={(e) => setFormData({ ...formData, shares: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="5" max={currentAktieData ? parseFloat(currentAktieData.current_shares || currentAktieData.shares) : undefined} /></div>
              <div><label className="block mb-1 text-sm font-medium">Verkaufspreis pro Aktie (€)</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} required placeholder="85.00" /></div>
              <div><label className="block mb-1 text-sm font-medium">Datum & Uhrzeit (optional)</label><input type="datetime-local" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} /><p className="text-xs text-gray-500 mt-1">Leer lassen für aktuelles Datum/Uhrzeit</p></div>
              <button type="submit" className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors font-medium" disabled={!selectedAktie}>Verkaufen</button>
            </>)}
          </form>
        ) : addType === 'csv' ? (
          <div className="text-center py-8">
            {safeDepots.length === 0 ? (<div className="text-red-500 py-4">Bitte erstelle zuerst ein Depot!</div>) : (<>
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>JustTrade CSV-Datei hochladen</p>
              <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Importiert automatisch ALLE Transaktionen (Käufe + Verkäufe)</p>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-left"><p className="font-medium mb-1">ℹ️ Hinweise:</p><ul className="text-xs space-y-1 list-disc list-inside"><li>ISIN wird automatisch zu Symbol konvertiert</li><li>Käufe UND Verkäufe werden importiert</li><li>Aktuelle Bestände werden automatisch berechnet</li><li>Import kann einige Sekunden dauern</li></ul></div>
              <div className="mb-4"><label className="block mb-2 text-sm font-medium">Depot auswählen</label><select value={formData.depot_id} onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} disabled={loading}>{safeDepots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <input type="file" accept=".csv" onChange={handleJustTradeCSVUpload} disabled={loading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
              {loading && (<div className="mt-4 text-blue-500"><div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div><p className="mt-2 text-sm">Import läuft... Bitte warten</p></div>)}
            </>)}
          </div>
        ) : (
          <div className="text-center py-8">
            {safeDepots.length === 0 ? (<div className="text-red-500 py-4">Bitte erstelle zuerst ein Depot!</div>) : (<>
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>JSON-Datei hochladen</p>
              <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Format: Array von Objekten</p>
              <div className="mb-4"><label className="block mb-2 text-sm font-medium">Depot auswählen</label><select value={formData.depot_id} onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>{safeDepots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <input type="file" accept=".json" onChange={handleJSONUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddModal;