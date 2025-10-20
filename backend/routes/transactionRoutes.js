// backend/routes/transactionRoutes.js
// ERSETZE DIE KOMPLETTE DATEI
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/buy', transactionController.buyAktie);
router.post('/sell', transactionController.sellAktie);
router.get('/:aktieId', transactionController.getTransactions);
router.get('/timeline/depot/:depotId', transactionController.getPerformanceTimeline);
router.get('/timeline/user', transactionController.getUserPerformanceTimeline);
router.delete('/:transactionId', transactionController.deleteTransaction); // NEU

module.exports = router;