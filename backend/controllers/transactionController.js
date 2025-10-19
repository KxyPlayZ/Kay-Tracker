// backend/controllers/transactionController.js
const pool = require('../config/database');

// Kauf einer Aktie - mit Datum/Uhrzeit
exports.buyAktie = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { depot_id, name, symbol, shares, price, category, transaction_date } = req.body;

    // Validierung
    if (!depot_id || !name || !symbol || !shares || !price) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    // Prüfen ob Depot dem User gehört
    const depotCheck = await client.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depot_id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    await client.query('BEGIN');

    // Prüfen ob Aktie bereits existiert
    const existingAktie = await client.query(
      'SELECT * FROM aktien WHERE depot_id = $1 AND symbol = $2',
      [depot_id, symbol]
    );

    let aktie;
    if (existingAktie.rows.length > 0) {
      // Aktie existiert - Menge erhöhen
      const existing = existingAktie.rows[0];
      const newShares = parseFloat(existing.current_shares || existing.shares) + parseFloat(shares);

      const updateResult = await client.query(
        `UPDATE aktien 
         SET shares = $1, 
             current_shares = $1,
             current_price = $2
         WHERE id = $3 
         RETURNING *`,
        [newShares, price, existing.id]
      );
      
      aktie = updateResult.rows[0];
    } else {
      // Neue Aktie erstellen
      const insertResult = await client.query(
        `INSERT INTO aktien (depot_id, name, symbol, shares, current_shares, buy_price, current_price, category) 
         VALUES ($1, $2, $3, $4, $4, $5, $5, $6) 
         RETURNING *`,
        [depot_id, name, symbol, shares, price, category || 'Aktie']
      );
      
      aktie = insertResult.rows[0];
    }

    // Transaction eintragen mit optional angegebenem Datum
    const timestamp = transaction_date ? new Date(transaction_date) : new Date();
    await client.query(
      'INSERT INTO transactions (aktie_id, type, shares, price, transaction_timestamp) VALUES ($1, $2, $3, $4, $5)',
      [aktie.id, 'BUY', shares, price, timestamp]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Kauf erfolgreich',
      aktie,
      transaction_timestamp: timestamp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Kauf:', error);
    res.status(500).json({ error: 'Serverfehler' });
  } finally {
    client.release();
  }
};

// Verkauf einer Aktie - mit Datum/Uhrzeit
exports.sellAktie = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { aktie_id, shares, price, transaction_date } = req.body;

    if (!aktie_id || !shares || !price) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    // Aktie holen und prüfen
    const aktieResult = await client.query(
      `SELECT a.*, d.user_id 
       FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE a.id = $1`,
      [aktie_id]
    );

    if (aktieResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    const aktie = aktieResult.rows[0];

    if (aktie.user_id !== req.userId) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const currentShares = parseFloat(aktie.current_shares || aktie.shares);
    const sellShares = parseFloat(shares);

    if (sellShares > currentShares) {
      return res.status(400).json({ 
        error: `Du besitzt nur ${currentShares} Aktien, kannst aber nicht ${sellShares} verkaufen` 
      });
    }

    await client.query('BEGIN');

    // Gewinn berechnen
    const gewinn = (parseFloat(price) - parseFloat(aktie.buy_price)) * sellShares;

    // Transaction ZUERST eintragen mit optionalem Datum
    const timestamp = transaction_date ? new Date(transaction_date) : new Date();
    await client.query(
      'INSERT INTO transactions (aktie_id, type, shares, price, transaction_timestamp) VALUES ($1, $2, $3, $4, $5)',
      [aktie_id, 'SELL', sellShares, price, timestamp]
    );

    // Aktien reduzieren
    const newShares = currentShares - sellShares;
    
    if (newShares === 0) {
      // Alle verkauft - current_shares auf 0 setzen aber Aktie behalten für Historie
      await client.query(
        'UPDATE aktien SET current_shares = 0, current_price = $1 WHERE id = $2',
        [price, aktie_id]
      );
    } else {
      // Teilverkauf - Menge reduzieren
      await client.query(
        'UPDATE aktien SET current_shares = $1, current_price = $2 WHERE id = $3',
        [newShares, price, aktie_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Verkauf erfolgreich',
      gewinn,
      remaining_shares: newShares,
      transaction_timestamp: timestamp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Verkauf:', error);
    res.status(500).json({ error: 'Serverfehler' });
  } finally {
    client.release();
  }
};

// Alle Transaktionen einer Aktie
exports.getTransactions = async (req, res) => {
  try {
    const { aktieId } = req.params;

    // Prüfen ob Aktie dem User gehört
    const aktieCheck = await pool.query(
      `SELECT a.* FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE a.id = $1 AND d.user_id = $2`,
      [aktieId, req.userId]
    );

    if (aktieCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Aktie nicht gefunden' });
    }

    const result = await pool.query(
      'SELECT * FROM transactions WHERE aktie_id = $1 ORDER BY transaction_timestamp DESC',
      [aktieId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Transaktionen:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Performance-Timeline für Charts
exports.getPerformanceTimeline = async (req, res) => {
  try {
    const { depotId } = req.params;

    // Prüfen ob Depot dem User gehört
    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [depotId, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    // Alle Transaktionen des Depots mit Gewinn-Berechnung
    const result = await pool.query(
      `SELECT 
        t.*,
        a.name,
        a.symbol,
        a.buy_price,
        (t.price - a.buy_price) * t.shares as gewinn_verlust
       FROM transactions t
       JOIN aktien a ON t.aktie_id = a.id
       WHERE a.depot_id = $1
       ORDER BY t.transaction_timestamp ASC`,
      [depotId]
    );

    // Kumulativen Gewinn berechnen
    let kumulativerGewinn = 0;
    const timeline = result.rows.map(row => {
      const gewinnVerlust = parseFloat(row.gewinn_verlust || 0);
      if (row.type === 'SELL') {
        kumulativerGewinn += gewinnVerlust;
      }
      
      return {
        date: row.transaction_timestamp,
        type: row.type,
        name: row.name,
        symbol: row.symbol,
        shares: parseFloat(row.shares),
        price: parseFloat(row.price),
        gewinn_verlust: gewinnVerlust,
        kumulativer_gewinn: kumulativerGewinn
      };
    });

    res.json(timeline);
  } catch (error) {
    console.error('Fehler beim Abrufen der Timeline:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Gesamte Performance für User
exports.getUserPerformanceTimeline = async (req, res) => {
  try {
    // Alle Transaktionen des Users
    const result = await pool.query(
      `SELECT 
        t.*,
        a.name,
        a.symbol,
        a.buy_price,
        d.name as depot_name,
        (t.price - a.buy_price) * t.shares as gewinn_verlust
       FROM transactions t
       JOIN aktien a ON t.aktie_id = a.id
       JOIN depots d ON a.depot_id = d.id
       WHERE d.user_id = $1
       ORDER BY t.transaction_timestamp ASC`,
      [req.userId]
    );

    // Kumulativen Gewinn berechnen
    let kumulativerGewinn = 0;
    const timeline = result.rows.map(row => {
      const gewinnVerlust = parseFloat(row.gewinn_verlust || 0);
      if (row.type === 'SELL') {
        kumulativerGewinn += gewinnVerlust;
      }
      
      return {
        date: row.transaction_timestamp,
        type: row.type,
        name: row.name,
        symbol: row.symbol,
        depot: row.depot_name,
        shares: parseFloat(row.shares),
        price: parseFloat(row.price),
        gewinn_verlust: gewinnVerlust,
        kumulativer_gewinn: kumulativerGewinn
      };
    });

    res.json(timeline);
  } catch (error) {
    console.error('Fehler beim Abrufen der User Timeline:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};
