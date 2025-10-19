// backend/controllers/aktienController.js
const pool = require('../config/database');

// Alle Aktien eines Depots abrufen
exports.getAktienByDepot = async (req, res) => {
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

    // Validierung
    if (!depot_id || !name || !symbol || !shares || !buy_price || !current_price) {
      console.log('Validierung fehlgeschlagen:', { depot_id, name, symbol, shares, buy_price, current_price });
      return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt sein' });
    }

    // Prüfen ob Depot dem User gehört
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

    // Prüfen ob Aktie dem User gehört
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

    // Prüfen ob Depot dem User gehört
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
        continue; // Überspringe ungültige Einträge
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

// Trade-Historie für ein Depot
exports.getTradeHistory = async (req, res) => {
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

    // Alle Transaktionen mit Aktien-Details
    const result = await pool.query(
      `SELECT 
        t.*,
        a.name,
        a.symbol,
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
