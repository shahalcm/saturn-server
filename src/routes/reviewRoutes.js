const express = require('express');
const { createReview, getProviderReviews, toggleReviewVisibility } = require('../controllers/reviewController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/provider/:id', getProviderReviews);
router.put('/:id/visibility', protect, adminProtect, toggleReviewVisibility);

module.exports = router;
