const express = require('express');
const { getMessages, sendMessage, getConversations, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:sessionId/messages', protect, getMessages);
router.post('/:sessionId/messages', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.put('/read/:senderId', protect, markAsRead);

module.exports = router;
