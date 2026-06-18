const express = require('express');
const { getNotifications, markRead, sendNotification } = require('../controllers/notificationController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.post('/', adminProtect, sendNotification);

module.exports = router;
