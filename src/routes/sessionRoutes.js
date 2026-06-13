const express = require('express');
const { startSession, endSession, getMySessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', protect, startSession);
router.put('/:id/end', protect, endSession);
router.get('/my', protect, getMySessions);

module.exports = router;
