// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Öffentliche Routen
router.post('/register', authController.register);
router.post('/login', authController.login);

// Geschützte Routen
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
