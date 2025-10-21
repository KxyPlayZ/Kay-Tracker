// backend/controllers/aktienController.js
const { getSymbolFromISIN, getCurrentPrice, getCurrentPrices } = require('../services/apiServices');
const pool = require('../config/database');

// Alle Aktien eines Depots abrufen
exports.getAktienByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depotId, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    const result = await pool.query(
      'SELECT * FROM aktien WHERE depot_id = $1 ORDER BY created_at DESC',
      [depotId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Aktien:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Alle Aktien des Users abrufen (über alle Depots)
exports.getAllAktien = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, d.name as depot_name 
       FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE d.user_id = $1 
       ORDER BY a.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen aller Aktien:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Einzelne Aktie abrufen
exports.getAktie = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, d.name as depot_name 
       FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE a.id = $1 AND d.user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Aktie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Neue Aktie hinzufügen
exports.createAktie = async (req, res) => {
  try {
    console.log('=== AKTIE HINZUFÜGEN ===');
    console.log('Received data:', req.body);
    console.log('User ID:', req.userId);
    
    const { depot_id, name, symbol, shares, buy_price, current_price, category } = req.body;

    if (!depot_id || !name || !symbol || !shares || !buy_price || !current_price) {
      console.log('Validierung fehlgeschlagen:', { depot_id, name, symbol, shares, buy_price, current_price });
      return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt sein' });
    }

    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depot_id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      console.log('Depot nicht gefunden:', depot_id, 'für User:', req.userId);
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    console.log('Depot gefunden:', depotCheck.rows[0]);

    const result = await pool.query(
      'INSERT INTO aktien (depot_id, name, symbol, shares, buy_price, current_price, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [depot_id, name, symbol, shares, buy_price, current_price, category || 'Aktie']
    );

    console.log('Aktie erfolgreich erstellt:', result.rows[0]);

    res.status(201).json({
      message: 'Aktie erfolgreich hinzugefügt',
      aktie: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Aktie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Aktie aktualisieren
exports.updateAktie = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, shares, buy_price, current_price, category } = req.body;

    const aktieCheck = await pool.query(
      `SELECT a.* FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE a.id = $1 AND d.user_id = $2`,
      [id, req.userId]
    );

    if (aktieCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    const result = await pool.query(
      `UPDATE aktien 
       SET name = COALESCE($1, name), 
           symbol = COALESCE($2, symbol), 
           shares = COALESCE($3, shares), 
           buy_price = COALESCE($4, buy_price), 
           current_price = COALESCE($5, current_price),
           category = COALESCE($6, category)
       WHERE id = $7 
       RETURNING *`,
      [name, symbol, shares, buy_price, current_price, category, id]
    );

    res.json({
      message: 'Aktie erfolgreich aktualisiert',
      aktie: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Aktie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Aktie löschen
exports.deleteAktie = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM aktien 
       WHERE id = $1 
       AND depot_id IN (SELECT id FROM depots WHERE user_id = $2) 
       RETURNING *`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    res.json({ message: 'Aktie erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Aktie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Mehrere Aktien importieren (CSV/JSON)
exports.importAktien = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { depot_id, aktien } = req.body;

    if (!depot_id || !Array.isArray(aktien) || aktien.length === 0) {
      return res.status(400).json({ error: 'Ungültige Daten' });
    }

    const depotCheck = await client.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depot_id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    await client.query('BEGIN');

    const importedAktien = [];
    
    for (const aktie of aktien) {
      const { name, symbol, shares, buy_price, current_price, category } = aktie;
      
      if (!name || !symbol || !shares || !buy_price || !current_price) {
        continue;
      }

      const result = await client.query(
        'INSERT INTO aktien (depot_id, name, symbol, shares, buy_price, current_price, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [depot_id, name, symbol, shares, buy_price, current_price, category || 'Aktie']
      );

      importedAktien.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${importedAktien.length} Aktien erfolgreich importiert`,
      aktien: importedAktien
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Importieren der Aktien:', error);
    res.status(500).json({ error: 'Serverfehler beim Import' });
  } finally {
    client.release();
  }
};

// JustTrade CSV Import mit ISIN-zu-Symbol-Konvertierung
exports.importJustTradeCSV = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { depot_id, aktien } = req.body;

    if (!depot_id || !Array.isArray(aktien) || aktien.length === 0) {
      return res.status(400).json({ error: 'Ungültige Daten' });
    }

    const depotCheck = await client.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depot_id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    await client.query('BEGIN');

    const importedAktien = [];
    const errors = [];
    
    // Sammle alle ISINs aus dem CSV
    const csvISINs = new Set();
    for (const aktie of aktien) {
      if (aktie.isin) {
        csvISINs.add(aktie.isin);
      }
    }
    
    // SCHRITT 1: Lösche alte CSV-Daten
    if (csvISINs.size > 0) {
      const isinArray = Array.from(csvISINs);
      
      await client.query(
        `DELETE FROM transactions 
         WHERE aktie_id IN (
           SELECT id FROM aktien 
           WHERE depot_id = $1 AND isin = ANY($2)
         )`,
        [depot_id, isinArray]
      );
      
      await client.query(
        `DELETE FROM aktien 
         WHERE depot_id = $1 AND isin = ANY($2)`,
        [depot_id, isinArray]
      );
      
      console.log(`✓ Alte CSV-Daten gelöscht für ${isinArray.length} ISINs`);
    }
    
    // SCHRITT 2: Gruppiere Transaktionen nach ISIN
    const transactionsByISIN = {};
    
    for (const [index, aktie] of aktien.entries()) {
      const { isin, name, shares, price, transaction_type, transaction_date } = aktie;
      
      if (!isin || !shares || !price) {
        errors.push({ index, error: 'Fehlende Pflichtfelder', data: aktie });
        continue;
      }

      if (!transactionsByISIN[isin]) {
        transactionsByISIN[isin] = [];
      }

      transactionsByISIN[isin].push({
        name,
        shares: parseFloat(shares),
        price: parseFloat(price),
        transaction_type: transaction_type || 'BUY',
        transaction_date: transaction_date || new Date(),
        index
      });
    }

    console.log(`Verarbeite ${Object.keys(transactionsByISIN).length} verschiedene Aktien...`);

    // SCHRITT 3: Verarbeite jede ISIN einzeln
    for (const [isin, transactions] of Object.entries(transactionsByISIN)) {
      try {
        const firstTx = transactions[0];
        
        console.log(`Suche ISIN ${isin} in Mapping-Tabelle...`);
        let mappingResult = await client.query(
          'SELECT symbol, name FROM isin_mapping WHERE user_id = $1 AND isin = $2',
          [req.userId, isin]
        );

        let symbol, aktienName;

        if (mappingResult.rows.length > 0) {
          if (mappingResult.rows[0].symbol && mappingResult.rows[0].symbol.trim() !== '') {
            symbol = mappingResult.rows[0].symbol;
            aktienName = firstTx.name || mappingResult.rows[0].name;
            console.log(`✓ ISIN ${isin} gefunden: ${symbol}`);
          } else {
            console.log(`⚠ ISIN ${isin} gefunden, aber Symbol fehlt`);
            errors.push({ 
              isin,
              name: firstTx.name || mappingResult.rows[0].name || 'Unbekannt',
              error: 'Symbol fehlt. Bitte in "ISIN Verwaltung" das Symbol nachtragen.',
              needsMapping: true,
              alreadyInTable: true
            });
            continue;
          }
        } else {
          console.log(`➕ ISIN ${isin} nicht gefunden - trage automatisch ein`);
          
          try {
            await client.query(
              'INSERT INTO isin_mapping (user_id, isin, symbol, name) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, isin) DO NOTHING',
              [req.userId, isin, '', firstTx.name || '']
            );
            
            errors.push({ 
              isin,
              name: firstTx.name || 'Unbekannt',
              error: 'ISIN wurde automatisch hinzugefügt. Bitte in "ISIN Verwaltung" das Symbol nachtragen.',
              needsMapping: true,
              autoAdded: true
            });
          } catch (insertError) {
            console.error(`Fehler beim automatischen Eintragen von ${isin}:`, insertError);
            errors.push({ 
              isin,
              name: firstTx.name || 'Unbekannt',
              error: 'Konnte ISIN nicht automatisch hinzufügen.',
              needsMapping: true
            });
          }
          continue;
        }

        // Berechne Gesamt-Käufe und aktuellen Bestand
        let totalBuyShares = 0;
        let totalBuyValue = 0;
        let currentShares = 0;

        for (const tx of transactions) {
          if (tx.transaction_type === 'BUY') {
            totalBuyShares += tx.shares;
            totalBuyValue += (tx.shares * tx.price);
            currentShares += tx.shares;
          } else if (tx.transaction_type === 'SELL') {
            currentShares -= tx.shares;
          }
        }

        const avgBuyPrice = totalBuyShares > 0 ? totalBuyValue / totalBuyShares : 0;

        console.log(`${symbol}: ${totalBuyShares} gekauft, aktuell ${currentShares} im Bestand (Ø ${avgBuyPrice.toFixed(2)}€)`);

        // Hole aktuellen Preis
        console.log(`Hole aktuellen Preis für ${symbol}...`);
        let currentPrice;
        try {
          const priceData = await getCurrentPrice(symbol);
          currentPrice = priceData.price;
        } catch (error) {
          console.error(`Preis konnte nicht abgerufen werden für ${symbol}, verwende letzten Preis`);
          currentPrice = transactions[transactions.length - 1].price;
        }

        // Erstelle neue Aktie
        const result = await client.query(
          `INSERT INTO aktien 
           (depot_id, name, symbol, isin, shares, buy_price, current_price, current_shares, category) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id`,
          [depot_id, aktienName, symbol, isin, totalBuyShares, avgBuyPrice, currentPrice, currentShares, 'Aktie']
        );
        
        const aktieId = result.rows[0].id;
        console.log(`✓ Aktie ${symbol} erstellt`);

        // Importiere alle Transaktionen
        for (const tx of transactions) {
          await client.query(
            `INSERT INTO transactions 
             (aktie_id, type, shares, price, transaction_timestamp) 
             VALUES ($1, $2, $3, $4, $5)`,
            [aktieId, tx.transaction_type, tx.shares, tx.price, tx.transaction_date]
          );
        }

        console.log(`✓ ${transactions.length} Transaktionen für ${symbol} importiert`);
        
        importedAktien.push({
          symbol,
          isin,
          transactions: transactions.length,
          currentShares
        });

      } catch (error) {
        console.error(`Fehler bei ISIN ${isin}:`, error);
        errors.push({ 
          isin,
          error: error.message,
          data: transactions[0]
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Import abgeschlossen',
      importedAktien,
      total: aktien.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim JustTrade CSV Import:', error);
    res.status(500).json({ error: 'Serverfehler beim Import' });
  } finally {
    client.release();
  }
};

// Trade-Historie für ein Depot
exports.getTradeHistory = async (req, res) => {
  try {
    const { depotId } = req.params;

    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depotId, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    const result = await pool.query(
      `SELECT 
        t.*,
        a.name,
        a.symbol,
        a.isin,
        a.buy_price,
        a.category
       FROM transactions t
       JOIN aktien a ON t.aktie_id = a.id
       WHERE a.depot_id = $1
       ORDER BY t.transaction_timestamp DESC`,
      [depotId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Trade-Historie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Aktualisiere Preise für alle Aktien eines Depots
exports.updatePrices = async (req, res) => {
  try {
    const { depot_id } = req.params;

    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depot_id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    const aktienResult = await pool.query(
      'SELECT id, symbol FROM aktien WHERE depot_id = $1',
      [depot_id]
    );

    if (aktienResult.rows.length === 0) {
      return res.json({ message: 'Keine Aktien im Depot', updated: 0 });
    }

    const symbols = [...new Set(aktienResult.rows.map(a => a.symbol))];
    const prices = await getCurrentPrices(symbols);

    let updated = 0;
    for (const aktie of aktienResult.rows) {
      const newPrice = prices[aktie.symbol];
      if (newPrice) {
        await pool.query(
          'UPDATE aktien SET current_price = $1 WHERE id = $2',
          [newPrice, aktie.id]
        );
        updated++;
      }
    }

    res.json({
      message: 'Preise aktualisiert',
      updated,
      total: aktienResult.rows.length,
      prices
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Preise:', error);
    res.status(500).json({ error: 'Serverfehler beim Preis-Update' });
  }
};

// Aktuellen Preis für eine einzelne Aktie abrufen
exports.refreshSinglePrice = async (req, res) => {
  try {
    const { id } = req.params;

    const aktieResult = await pool.query(
      `SELECT a.*, d.user_id 
       FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE a.id = $1 AND d.user_id = $2`,
      [id, req.userId]
    );

    if (aktieResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    const aktie = aktieResult.rows[0];
    const priceData = await getCurrentPrice(aktie.symbol);

    await pool.query(
      'UPDATE aktien SET current_price = $1 WHERE id = $2',
      [priceData.price, id]
    );

    res.json({
      message: 'Preis aktualisiert',
      aktie_id: id,
      symbol: aktie.symbol,
      old_price: aktie.current_price,
      new_price: priceData.price,
      currency: priceData.currency,
      timestamp: priceData.timestamp
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Preises:', error);
    res.status(500).json({ error: 'Serverfehler beim Preis-Update' });
  }
};

// Punkt 5: Aktualisiere alle Aktien eines Users basierend auf ISIN-Mapping
exports.updateAllStocksFromISINMapping = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const mappingsResult = await client.query(
      'SELECT isin, symbol, name FROM isin_mapping WHERE user_id = $1 AND symbol IS NOT NULL AND symbol != \'\'',
      [req.userId]
    );
    
    if (mappingsResult.rows.length === 0) {
      return res.json({ message: 'Keine ISIN-Mappings zum Aktualisieren gefunden', updated: 0 });
    }
    
    let updated = 0;
    
    for (const mapping of mappingsResult.rows) {
      const result = await client.query(
        `UPDATE aktien a
         SET symbol = $1, name = COALESCE($2, a.name)
         FROM depots d
         WHERE a.depot_id = d.id 
           AND d.user_id = $3 
           AND a.isin = $4`,
        [mapping.symbol, mapping.name, req.userId, mapping.isin]
      );
      
      updated += result.rowCount;
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: `${updated} Aktien wurden mit den aktuellen Symbolen aus der ISIN-Verwaltung aktualisiert`,
      updated,
      totalMappings: mappingsResult.rows.length
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Aktualisieren der Aktien aus ISIN-Mapping:', error);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren' });
  } finally {
    client.release();
  }
};