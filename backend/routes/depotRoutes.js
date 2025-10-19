// backend/routes/depotRoutes.js
const express = require('express');
const router = express.Router();
const depotController = require('../controllers/depotController');
const authMiddleware = require('../middleware/authMiddleware');

// Alle Routen benötigen Authentifizierung
router.use(authMiddleware);

// Depot Routen
router.get('/', depotController.getAllDepots);
router.get('/:id', depotController.getDepot);
router.post('/', depotController.createDepot);
router.put('/:id', depotController.updateDepot);
router.delete('/:id', depotController.deleteDepot);
router.get('/:id/stats', depotController.getDepotStats);
router.delete('/:id/clear', depotController.clearDepotData);
router.delete('/clear-all/user-data', depotController.clearAllUserData);

module.exports = router;
