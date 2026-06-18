const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateToken } = require('../controllers/agoraController');

router.post('/token', protect, generateToken);

module.exports = router;
