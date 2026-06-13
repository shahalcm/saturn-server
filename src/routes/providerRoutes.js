const express = require('express');
const { getProviders, getProviderById, updateProviderProfile, updateOnlineStatus, uploadDocuments, registerProvider } = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getProviders);
router.get('/:id', getProviderById);
router.post('/register', protect, registerProvider);
router.put('/profile', protect, updateProviderProfile);
router.put('/status', protect, updateOnlineStatus);
router.put('/documents', protect, upload.array('documents', 5), uploadDocuments);

module.exports = router;
