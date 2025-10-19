// backend/controllers/depotController.js
const pool = require('../config/database');

// Alle Depots eines Users abrufen
exports.getAllDepots = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM depots WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Depots:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Einzelnes Depot abrufen
exports.getDepot = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des Depots:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Neues Depot erstellen
exports.createDepot = async (req, res) => {
  try {
    const { name, cash_bestand } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Depot-Name ist erforderlich' });
    }

    const result = await pool.query(
      'INSERT INTO depots (user_id, name, cash_bestand) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name, cash_bestand || 0]
    );

    res.status(201).json({
      message: 'Depot erfolgreich erstellt',
      depot: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Depots:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Depot aktualisieren
exports.updateDepot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cash_bestand } = req.body;

    const result = await pool.query(
      'UPDATE depots SET name = COALESCE($1, name), cash_bestand = COALESCE($2, cash_bestand) WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, cash_bestand, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    res.json({
      message: 'Depot erfolgreich aktualisiert',
      depot: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Depots:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Depot löschen
exports.deleteDepot = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM depots WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    res.json({ message: 'Depot erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Depots:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Depot-Statistiken abrufen
exports.getDepotStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Prüfen ob Depot dem User gehört
    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    // Alle Aktien des Depots abrufen
    const aktienResult = await pool.query(
      'SELECT * FROM aktien WHERE depot_id = $1',
      [id]
    );

    const aktien = aktienResult.rows;
    const depot = depotCheck.rows[0];

    // Statistiken berechnen
    const totalInvested = aktien.reduce((sum, a) => sum + (parseFloat(a.shares) * parseFloat(a.buy_price)), 0);
    const currentValue = aktien.reduce((sum, a) => sum + (parseFloat(a.shares) * parseFloat(a.current_price)), 0);
    const totalGain = currentValue - totalInvested;
    const totalValue = currentValue + parseFloat(depot.cash_bestand);

    res.json({
      depot_id: depot.id,
      depot_name: depot.name,
      cash_bestand: parseFloat(depot.cash_bestand),
      total_invested: totalInvested,
      current_value: currentValue,
      total_gain: totalGain,
      total_value: totalValue,
      gain_percentage: totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0,
      aktien_count: aktien.length
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Depot-Statistiken:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Alle Aktien eines Depots löschen
exports.clearDepotData = async (req, res) => {
  try {
    const { id } = req.params;

    // Prüfen ob Depot dem User gehört
    const depotCheck = await pool.query(
      'SELECT * FROM depots WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (depotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Depot nicht gefunden' });
    }

    // Alle Aktien des Depots löschen
    const result = await pool.query(
      'DELETE FROM aktien WHERE depot_id = $1',
      [id]
    );

    res.json({ 
      message: 'Alle Aktien aus dem Depot gelöscht',
      deleted_count: result.rowCount 
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Depot-Daten:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Alle Daten des Users löschen (außer Account)
exports.clearAllUserData = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Zähle was gelöscht wird
    const depotsCount = await client.query(
      'SELECT COUNT(*) FROM depots WHERE user_id = $1',
      [req.userId]
    );

    const aktienCount = await client.query(
      `SELECT COUNT(*) FROM aktien a 
       JOIN depots d ON a.depot_id = d.id 
       WHERE d.user_id = $1`,
      [req.userId]
    );

    // Alle Depots löschen (Aktien werden durch CASCADE automatisch gelöscht)
    await client.query(
      'DELETE FROM depots WHERE user_id = $1',
      [req.userId]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Alle Daten erfolgreich gelöscht',
      deleted_depots: parseInt(depotsCount.rows[0].count),
      deleted_aktien: parseInt(aktienCount.rows[0].count)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Löschen aller Daten:', error);
    res.status(500).json({ error: 'Serverfehler' });
  } finally {
    client.release();
  }
};
