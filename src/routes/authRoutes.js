const express = require('express');
const { sendOTP, verifyOTP, adminLogin, refreshToken, checkUser } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/send-otp', authLimiter, sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/admin-login', adminLogin);
router.post('/refresh-token', refreshToken);
router.post('/check-user', checkUser);

module.exports = router;
