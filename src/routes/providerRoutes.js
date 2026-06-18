const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getProviders,
  getProviderById,
  getMyProfile,
  updateProviderProfile,
  updateOnlineStatus,
  uploadDocuments,
  getEarnings,
  getMyReviews,
  updateFCMToken,
  getDashboardStats,
  registerProvider,
} = require('../controllers/providerController');

// Public routes
router.get('/', getProviders);
router.get('/:id', getProviderById);

// Protected provider routes
router.get('/my/profile', protect, getMyProfile);
router.get('/my/earnings', protect, getEarnings);
router.get('/my/reviews', protect, getMyReviews);
router.get('/my/dashboard-stats', protect, getDashboardStats);
router.post('/register', protect, registerProvider);
router.put('/profile', protect, updateProviderProfile);
router.put('/status', protect, updateOnlineStatus);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/documents', protect, upload.array('documents', 5), uploadDocuments);

module.exports = router;
