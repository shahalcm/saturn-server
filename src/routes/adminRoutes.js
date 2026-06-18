const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllProviders,
  getProviderByIdAdmin,
  verifyProvider,
  banUser,
  getAllSessions,
  getCommission,
  updateCommission,
  getAllPrayers,
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  getRevenueStats,
  getNotifications,
  sendNotification,
  getCommunityPosts,
  hidePost,
  deletePost,
} = require('../controllers/adminController');

router.use(adminProtect);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);
router.get('/revenue-stats', getRevenueStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/ban', banUser);

// Providers
router.get('/providers', getAllProviders);
router.get('/providers/:id', getProviderByIdAdmin);
router.put('/providers/:id/verify', verifyProvider);

// Sessions
router.get('/sessions', getAllSessions);

// Commission
router.get('/commission', getCommission);
router.put('/commission', updateCommission);

// Prayers
router.get('/prayers', getAllPrayers);

// Advertisements
router.get('/advertisements', getAdvertisements);
router.post('/advertisements', createAdvertisement);
router.put('/advertisements/:id', updateAdvertisement);
router.delete('/advertisements/:id', deleteAdvertisement);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications/send', sendNotification);

// Community
router.get('/community', getCommunityPosts);
router.put('/community/:id/hide', hidePost);
router.delete('/community/:id', deletePost);

module.exports = router;
