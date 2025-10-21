// backend/routes/aktienRoutes.js
const express = require('express');
const router = express.Router();
const aktienController = require('../controllers/aktienController');
const authMiddleware = require('../middleware/authMiddleware');

// Alle Routen benötigen Authentifizierung
router.use(authMiddleware);

// Aktien Routen
router.get('/', aktienController.getAllAktien);
router.get('/depot/:depotId', aktienController.getAktienByDepot);
router.get('/:id', aktienController.getAktie);
router.post('/', aktienController.createAktie);
router.post('/import', aktienController.importAktien);
router.put('/:id', aktienController.updateAktie);
router.delete('/:id', aktienController.deleteAktie);
router.get('/history/depot/:depotId', aktienController.getTradeHistory);

// Neue Routen für JustTrade Import und Preis-Updates
router.post('/import/justtrade', aktienController.importJustTradeCSV);
router.post('/prices/update/:depot_id', aktienController.updatePrices);
router.post('/prices/refresh/:id', aktienController.refreshSinglePrice);

module.exports = router;