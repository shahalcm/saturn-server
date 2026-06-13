const express = require('express');
const { createOrder, verifyPayment, payout, getTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/payout', protect, payout);
router.get('/history', protect, getTransactions);

module.exports = router;
