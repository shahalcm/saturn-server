const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyFees, updateMyFees } = require('../controllers/feeController');

router.get('/my', protect, getMyFees);
router.put('/my', protect, updateMyFees);

module.exports = router;
