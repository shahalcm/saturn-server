const express = require('express');
const { sendOTP, verifyOTP, adminLogin, refreshToken } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/send-otp', authLimiter, sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/admin-login', adminLogin);
router.post('/refresh-token', refreshToken);

module.exports = router;
