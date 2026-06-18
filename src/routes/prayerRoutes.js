const express = require('express');
const { getPrayers, getLivePrayers, createPrayer, startPrayer, endPrayer, cancelPrayer } = require('../controllers/prayerController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPrayers);
router.get('/live', getLivePrayers);
router.post('/', adminProtect, createPrayer);
router.put('/:id/start', adminProtect, startPrayer);
router.put('/:id/end', adminProtect, endPrayer);
router.put('/:id/cancel', adminProtect, cancelPrayer);

module.exports = router;
