-- Migration: ISIN-Spalte zur aktien Tabelle hinzufügen
ALTER TABLE aktien 
ADD COLUMN isin VARCHAR(12);

-- Index für schnellere ISIN-Suche
CREATE INDEX idx_aktien_isin ON aktien(isin);

-- Kommentar zur Dokumentation
COMMENT ON COLUMN aktien.isin IS 'International Securities Identification Number';
