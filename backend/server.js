// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const depotRoutes = require('./routes/depotRoutes');
const aktienRoutes = require('./routes/aktienRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const isinMappingRoutes = require('./routes/isinMappingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://192.168.178.96:5173',
    'http://192.168.178.202:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/depots', depotRoutes);
app.use('/api/aktien', aktienRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/isin-mapping', isinMappingRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Aktien Tracker API läuft!' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Etwas ist schief gelaufen!',
    message: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📡 Erreichbar auf: http://192.168.178.96:${PORT}`);
});