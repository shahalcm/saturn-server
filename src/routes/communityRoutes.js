const express = require('express');
const { createPost, getPosts, likePost, addComment, reportPost, deletePost } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createPost);
router.get('/', getPosts);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.post('/:id/report', protect, reportPost);
router.delete('/:id', protect, deletePost);

module.exports = router;
