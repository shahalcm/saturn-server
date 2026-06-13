const express = require('express');
const { 
  getDashboardStats, 
  getVerificationRequests, 
  verifyProvider, 
  banUser, 
  banProvider, 
  updateCommissionRates, 
  getCommissionStats,
  getAllUsers,
  getAllProviders,
  getAllSessions
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', adminProtect, getDashboardStats);
router.get('/verifications', adminProtect, getVerificationRequests);
router.put('/providers/:id/verify', adminProtect, verifyProvider);
router.put('/users/:id/ban', adminProtect, banUser);
router.put('/providers/:id/ban', adminProtect, banProvider);
router.put('/commission', adminProtect, updateCommissionRates);
router.get('/commission', adminProtect, getCommissionStats);
router.get('/users', adminProtect, getAllUsers);
router.get('/providers', adminProtect, getAllProviders);
router.get('/sessions', adminProtect, getAllSessions);

module.exports = router;
