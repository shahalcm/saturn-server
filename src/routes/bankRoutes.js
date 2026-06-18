const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const {
  getBankDetails, saveBankDetails,
  requestWithdrawal, getMyWithdrawals,
  getAllWithdrawals, processWithdrawal,
} = require('../controllers/bankController');

// Provider routes
router.get('/details', protect, getBankDetails);
router.post('/details', protect, saveBankDetails);
router.put('/details', protect, saveBankDetails);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals/my', protect, getMyWithdrawals);

// Admin routes
router.get('/admin/withdrawals', adminProtect, getAllWithdrawals);
router.put('/admin/withdrawals/:id/process', adminProtect, processWithdrawal);

module.exports = router;
