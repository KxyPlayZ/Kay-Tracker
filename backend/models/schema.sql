-- Users Tabelle
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depots Tabelle
CREATE TABLE depots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cash_bestand DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aktien Tabelle
CREATE TABLE aktien (
    id SERIAL PRIMARY KEY,
    depot_id INTEGER REFERENCES depots(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    shares DECIMAL(12, 4) NOT NULL,
    buy_price DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(20) DEFAULT 'Aktie',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Tabelle
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    aktie_id INTEGER REFERENCES aktien(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL,
    shares DECIMAL(12, 4) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes
CREATE INDEX idx_depots_user_id ON depots(user_id);
CREATE INDEX idx_aktien_depot_id ON aktien(depot_id);
CREATE INDEX idx_transactions_aktie_id ON transactions(aktie_id);
