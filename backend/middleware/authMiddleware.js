// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Token aus Header holen
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Zugriff verweigert. Kein Token vorhanden.' });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token ist abgelaufen' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ungültiger Token' });
    }
    res.status(500).json({ error: 'Serverfehler bei Authentifizierung' });
  }
};

module.exports = authMiddleware;
