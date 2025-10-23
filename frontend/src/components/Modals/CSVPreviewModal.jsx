// frontend/src/components/Modals/CSVPreviewModal.jsx
import React, { useState } from 'react';
import { X, Check, Upload } from 'lucide-react';

const CSVPreviewModal = ({ show, onClose, transactions, onConfirm, darkMode, importMode, setImportMode }) => {
  const [selectedTransactions, setSelectedTransactions] = useState(
    new Set(transactions.map((_, idx) => idx))
  );

  if (!show) return null;

  const toggleTransaction = (index) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((_, idx) => idx)));
    }
  };

  const handleConfirm = () => {
    const selected = transactions.filter((_, idx) => selectedTransactions.has(idx));
    onConfirm(selected);
  };

  const buyTransactions = transactions.filter(t => t.transaction_type === 'BUY');
  const sellTransactions = transactions.filter(t => t.transaction_type === 'SELL');
  const selectedCount = selectedTransactions.size;

  // Gruppiere Transaktionen nach ISIN
  const groupedByISIN = transactions.reduce((acc, trans, idx) => {
    if (!acc[trans.isin]) {
      acc[trans.isin] = [];
    }
    acc[trans.isin].push({ ...trans, originalIndex: idx });
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">CSV Import Vorschau</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Import Mode Auswahl */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Import-Modus:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Ersetzen (alte CSV-Daten löschen)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="add"
                  checked={importMode === 'add'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Hinzufügen (bestehende Daten behalten)</span>
              </label>
            </div>
          </div>

          {/* Statistik */}
          <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg grid grid-cols-4 gap-4`}>
            <div>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <div className="text-xs text-gray-500">Gesamt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{buyTransactions.length}</div>
              <div className="text-xs text-gray-500">Käufe</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{sellTransactions.length}</div>
              <div className="text-xs text-gray-500">Verkäufe</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{selectedCount}</div>
              <div className="text-xs text-gray-500">Ausgewählt</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={toggleAll}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              {selectedTransactions.size === transactions.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>

          {Object.entries(groupedByISIN).map(([isin, transactionsForISIN]) => {
            const firstTrans = transactionsForISIN[0];
            return (
              <div key={isin} className={`mb-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">{firstTrans.name}</h3>
                  <div className="text-xs text-gray-500">ISIN: {isin}</div>
                </div>
                
                <div className="space-y-2">
                  {transactionsForISIN.map((trans) => (
                    <div
                      key={trans.originalIndex}
                      className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                        selectedTransactions.has(trans.originalIndex)
                          ? darkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300'
                          : darkMode ? 'bg-gray-600' : 'bg-white'
                      } border`}
                      onClick={() => toggleTransaction(trans.originalIndex)}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedTransactions.has(trans.originalIndex)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedTransactions.has(trans.originalIndex) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trans.transaction_type === 'BUY'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {trans.transaction_type === 'BUY' ? 'KAUF' : 'VERKAUF'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{trans.shares} Stk.</div>
                          <div className="text-xs text-gray-500">Anzahl</div>
                        </div>
                        <div>
                          <div className="font-medium">€{trans.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Preis</div>
                        </div>
                        <div>
                          <div className="font-medium">€{(trans.shares * trans.price).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Gesamt</div>
                        </div>
                        <div>
                          <div className="font-medium">{new Date(trans.transaction_date).toLocaleDateString('de-DE')}</div>
                          <div className="text-xs text-gray-500">Datum</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <div className="text-sm text-gray-500">
            {selectedCount} von {transactions.length} Transaktionen ausgewählt
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={`px-6 py-2 rounded font-medium transition-colors flex items-center gap-2 ${
                selectedCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Upload size={18} />
              {importMode === 'replace' ? 'Ersetzen & Importieren' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVPreviewModal;
