// backend/routes/isinMappingRoutes.js
const express = require('express');
const router = express.Router();
const isinMappingController = require('../controllers/isinMappingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', isinMappingController.getAllMappings);
router.get('/:isin', isinMappingController.getMappingByISIN);
router.post('/', isinMappingController.createMapping);
router.put('/:id', isinMappingController.updateMapping);
router.delete('/:id', isinMappingController.deleteMapping);

module.exports = router;
