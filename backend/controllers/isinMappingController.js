// backend/controllers/isinMappingController.js
const pool = require('../config/database');

// Alle ISIN Mappings eines Users
exports.getAllMappings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM isin_mapping WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der ISIN Mappings:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Einzelnes Mapping abrufen
exports.getMappingByISIN = async (req, res) => {
  try {
    const { isin } = req.params;
    const result = await pool.query(
      'SELECT * FROM isin_mapping WHERE user_id = $1 AND isin = $2',
      [req.userId, isin]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ISIN nicht gefunden' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des ISIN Mappings:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Neues Mapping erstellen
exports.createMapping = async (req, res) => {
  try {
    const { isin, symbol, name } = req.body;

    if (!isin || !symbol) {
      return res.status(400).json({ error: 'ISIN und Symbol sind erforderlich' });
    }

    const result = await pool.query(
      'INSERT INTO isin_mapping (user_id, isin, symbol, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, isin.toUpperCase(), symbol.toUpperCase(), name]
    );

    res.status(201).json({
      message: 'ISIN Mapping erstellt',
      mapping: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'ISIN existiert bereits' });
    }
    console.error('Fehler beim Erstellen des ISIN Mappings:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Mapping aktualisieren
exports.updateMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol, name } = req.body;

    const result = await pool.query(
      'UPDATE isin_mapping SET symbol = COALESCE($1, symbol), name = COALESCE($2, name) WHERE id = $3 AND user_id = $4 RETURNING *',
      [symbol?.toUpperCase(), name, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ISIN Mapping nicht gefunden' });
    }

    res.json({
      message: 'ISIN Mapping aktualisiert',
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des ISIN Mappings:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};

// Mapping löschen
exports.deleteMapping = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM isin_mapping WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ISIN Mapping nicht gefunden' });
    }

    res.json({ message: 'ISIN Mapping gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des ISIN Mappings:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
};
