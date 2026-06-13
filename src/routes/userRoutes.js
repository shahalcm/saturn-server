const express = require('express');
const { getProfile, updateProfile, updateAvatar, updateFCMToken, walletTopup } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/wallet/topup', protect, walletTopup);

module.exports = router;
