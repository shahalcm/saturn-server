const express = require('express');
const { getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement, recordClick, recordImpression } = require('../controllers/advertisementController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAdvertisements);
router.post('/', protect, adminProtect, createAdvertisement);
router.put('/:id', protect, adminProtect, updateAdvertisement);
router.delete('/:id', protect, adminProtect, deleteAdvertisement);
router.post('/:id/click', recordClick);
router.post('/:id/impression', recordImpression);

module.exports = router;
