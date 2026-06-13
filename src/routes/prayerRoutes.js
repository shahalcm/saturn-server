const express = require('express');
const { getPrayers, getLivePrayers, createPrayer, startPrayer, endPrayer, cancelPrayer } = require('../controllers/prayerController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPrayers);
router.get('/live', getLivePrayers);
router.post('/', protect, adminProtect, createPrayer);
router.put('/:id/start', protect, adminProtect, startPrayer);
router.put('/:id/end', protect, adminProtect, endPrayer);
router.put('/:id/cancel', protect, adminProtect, cancelPrayer);

module.exports = router;
