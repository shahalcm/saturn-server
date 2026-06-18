const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getPrayers, getLivePrayers, getPrayerById,
  createPrayer, updatePrayer, startPrayer,
  endPrayer, updateViewers, deletePrayer,
  getComments, addComment, likeComment,
  deleteComment, adminHideComment, adminPinComment,
  recordDonation, getDonations,
  adminGetComments, adminGetDonations,
  adminToggleComments, adminUpdateYouTubeLink,
} = require('../controllers/prayerController');

// Public routes
router.get('/', getPrayers);
router.get('/live', getLivePrayers);
router.get('/:id', getPrayerById);

// Comment routes (auth optional for viewing, required for posting)
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.put('/comments/:commentId/like', protect, likeComment);
router.delete('/comments/:commentId', protect, deleteComment);

// Donation routes
router.post('/:id/donate', recordDonation);
router.get('/:id/donations', getDonations);

// Admin routes
router.post('/', adminProtect, upload.single('googlePayQrCode'), createPrayer);
router.put('/:id', adminProtect, upload.single('googlePayQrCode'), updatePrayer);
router.put('/:id/start', adminProtect, startPrayer);
router.put('/:id/end', adminProtect, endPrayer);
router.put('/:id/viewers', updateViewers);
router.delete('/:id', adminProtect, deletePrayer);
router.put('/:id/youtube', adminProtect, adminUpdateYouTubeLink);
router.put('/:id/toggle-comments', adminProtect, adminToggleComments);
router.get('/:id/admin-comments', adminProtect, adminGetComments);
router.get('/:id/admin-donations', adminProtect, adminGetDonations);
router.put('/comments/:commentId/hide', adminProtect, adminHideComment);
router.put('/comments/:commentId/pin', adminProtect, adminPinComment);

module.exports = router;
