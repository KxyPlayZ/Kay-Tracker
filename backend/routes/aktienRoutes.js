// backend/routes/aktienRoutes.js
const express = require('express');
const router = express.Router();
const aktienController = require('../controllers/aktienController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET Routen
router.get('/', aktienController.getAllAktien);
router.get('/depot/:depotId', aktienController.getAktienByDepot);
router.get('/history/depot/:depotId', aktienController.getTradeHistory);
router.get('/:id', aktienController.getAktie);  // ← Am Ende der GET Routen

// POST Routen
router.post('/', aktienController.createAktie);
router.post('/import', aktienController.importAktien);
router.post('/import/justtrade', aktienController.importJustTradeCSV);

// PUT Routen - WICHTIG: Spezifische Routen VOR /:id!
router.put('/prices/:depot_id', aktienController.updatePrices);        // ← VOR /:id
router.put('/refresh/:id', aktienController.refreshSinglePrice);       // ← VOR /:id
router.put('/:id', aktienController.updateAktie);                      // ← Am Ende

// DELETE Routen
router.delete('/:id', aktienController.deleteAktie);

module.exports = router;