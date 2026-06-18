const Prayer = require('../models/Prayer');
const PrayerComment = require('../models/PrayerComment');
const CharityDonation = require('../models/CharityDonation');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const { getIO } = require('../config/socket');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Extract YouTube ID helper
const extractYouTubeId = (url) => {
  if (!url) return null;
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  if (url.includes('live/')) return url.split('live/')[1]?.split('?')[0];
  if (url.includes('embed/')) return url.split('embed/')[1]?.split('?')[0];
  return null;
};

// @GET /api/prayers
const getPrayers = async (req, res) => {
  try {
    const { religion, status } = req.query;
    const filter = {};
    if (religion) filter.religion = religion;
    if (status) filter.status = status;

    const prayers = await Prayer.find(filter)
      .sort({ scheduledDate: 1, scheduledTime: 1 });
    return successResponse(res, prayers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/prayers/live
const getLivePrayers = async (req, res) => {
  try {
    const { religion } = req.query;
    const filter = { status: 'live' };
    if (religion) filter.religion = religion;
    const prayers = await Prayer.find(filter);
    return successResponse(res, prayers);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/prayers/:id
const getPrayerById = async (req, res) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);

    // Increment total views
    await Prayer.findByIdAndUpdate(req.params.id, {
      $inc: { totalViews: 1 },
    });

    return successResponse(res, prayer);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/prayers — admin creates prayer
const createPrayer = async (req, res) => {
  try {
    const {
      title, religion, host, scheduledDate, scheduledTime,
      youtubeUrl, description, recurrence, sendNotification,
      commentsEnabled, charityEnabled, charityTitle,
      charityDescription, charityGoalAmount, googlePayUpiId, googlePayName,
    } = req.body;

    let googlePayQrCode = null;

    // Upload QR code image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'saturn/charity-qr',
        width: 400,
        crop: 'scale',
      });
      googlePayQrCode = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const youtubeVideoId = extractYouTubeId(youtubeUrl);

    const prayer = await Prayer.create({
      title,
      religion,
      host,
      scheduledDate,
      scheduledTime,
      youtubeUrl,
      youtubeVideoId,
      description,
      recurrence: recurrence || 'one-time',
      sendNotification: sendNotification !== false,
      commentsEnabled: commentsEnabled !== false,
      charityEnabled: charityEnabled === true || charityEnabled === 'true',
      charityTitle,
      charityDescription,
      charityGoalAmount: Number(charityGoalAmount) || 0,
      googlePayQrCode,
      googlePayUpiId,
      googlePayName,
      createdBy: 'admin',
    });

    return successResponse(res, prayer, 'Prayer scheduled successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id — admin updates prayer
const updatePrayer = async (req, res) => {
  try {
    let googlePayQrCode = req.body.googlePayQrCode;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'saturn/charity-qr',
        width: 400,
        crop: 'scale',
      });
      googlePayQrCode = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    if (req.body.youtubeUrl) {
      req.body.youtubeVideoId = extractYouTubeId(req.body.youtubeUrl);
    }

    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, googlePayQrCode },
      { new: true }
    );

    // Emit update to all viewers via socket
    const io = getIO();
    if (io) {
      io.to(`prayer_${req.params.id}`).emit('prayerUpdated', prayer);
    }

    return successResponse(res, prayer, 'Prayer updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/start — go live
const startPrayer = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const updateData = { status: 'live' };

    if (youtubeUrl) {
      updateData.youtubeUrl = youtubeUrl;
      updateData.youtubeVideoId = extractYouTubeId(youtubeUrl);
    }

    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Notify all users via socket
    const io = getIO();
    if (io) {
      io.emit('prayerStarted', {
        prayerId: prayer._id,
        title: prayer.title,
        religion: prayer.religion,
      });
    }

    return successResponse(res, prayer, 'Prayer is now LIVE');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/end
const endPrayer = async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );

    const io = getIO();
    if (io) {
      io.to(`prayer_${req.params.id}`).emit('prayerEnded', {
        prayerId: prayer._id,
      });
    }

    return successResponse(res, prayer, 'Prayer ended');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/:id/viewers
const updateViewers = async (req, res) => {
  try {
    const { viewers } = req.body;
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { viewers, $max: { peakViewers: viewers } },
      { new: true }
    );

    const io = getIO();
    if (io) {
      io.to(`prayer_${req.params.id}`).emit('viewerCount', { viewers });
    }

    return successResponse(res, prayer);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/prayers/:id
const deletePrayer = async (req, res) => {
  try {
    await Prayer.findByIdAndDelete(req.params.id);
    await PrayerComment.deleteMany({ prayerId: req.params.id });
    return successResponse(res, null, 'Prayer deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ====== COMMENT CONTROLLERS ======

// @GET /api/prayers/:id/comments
const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const comments = await PrayerComment.find({
      prayerId: req.params.id,
      isDeleted: false,
      isHidden: false,
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await PrayerComment.countDocuments({
      prayerId: req.params.id,
      isDeleted: false,
    });

    return successResponse(res, { comments, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/prayers/:id/comments
const addComment = async (req, res) => {
  try {
    const { text, userName, userType, userId } = req.body;
    const prayerId = req.params.id;

    if (!text || !text.trim()) {
      return errorResponse(res, 'Comment text is required');
    }

    if (text.trim().length > 300) {
      return errorResponse(res, 'Comment too long (max 300 characters)');
    }

    const prayer = await Prayer.findById(prayerId);
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);
    if (!prayer.commentsEnabled) {
      return errorResponse(res, 'Comments are disabled for this prayer');
    }

    const comment = await PrayerComment.create({
      prayerId,
      userId: req.userId || null,
      userName: userName || 'Anonymous',
      userType: userType || 'seeker',
      text: text.trim(),
      religion: prayer.religion,
    });

    // Update comment count
    await Prayer.findByIdAndUpdate(prayerId, {
      $inc: { totalComments: 1 },
    });

    // Broadcast to all viewers via socket
    const io = getIO();
    if (io) {
      io.to(`prayer_${prayerId}`).emit('newComment', {
        ...comment.toObject(),
        createdAt: new Date(),
      });
    }

    return successResponse(res, comment, 'Comment added', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/prayers/comments/:commentId/like
const likeComment = async (req, res) => {
  try {
    const comment = await PrayerComment.findById(req.params.commentId);
    if (!comment) return errorResponse(res, 'Comment not found', 404);

    const userId = req.userId;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }
    await comment.save();

    return successResponse(res, { likes: comment.likes.length, isLiked: !isLiked });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/prayers/comments/:commentId — user deletes own comment
const deleteComment = async (req, res) => {
  try {
    await PrayerComment.findByIdAndUpdate(req.params.commentId, { isDeleted: true });
    return successResponse(res, null, 'Comment deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN comment controls
const adminHideComment = async (req, res) => {
  try {
    const comment = await PrayerComment.findByIdAndUpdate(
      req.params.commentId,
      { isHidden: true },
      { new: true }
    );
    const io = getIO();
    if (io) {
      io.to(`prayer_${comment.prayerId}`).emit('commentHidden', {
        commentId: comment._id,
      });
    }
    return successResponse(res, comment, 'Comment hidden');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const adminPinComment = async (req, res) => {
  try {
    // Unpin all others first
    await PrayerComment.updateMany(
      { prayerId: req.body.prayerId },
      { isPinned: false }
    );

    const comment = await PrayerComment.findByIdAndUpdate(
      req.params.commentId,
      { isPinned: true },
      { new: true }
    );

    const io = getIO();
    if (io) {
      io.to(`prayer_${comment.prayerId}`).emit('commentPinned', {
        comment: comment,
      });
    }

    return successResponse(res, comment, 'Comment pinned');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ====== CHARITY / DONATION CONTROLLERS ======

// @POST /api/prayers/:id/donate — record donation
const recordDonation = async (req, res) => {
  try {
    const { amount, upiTransactionId, message, userName } = req.body;
    const prayerId = req.params.id;

    if (!amount || amount <= 0) {
      return errorResponse(res, 'Invalid donation amount');
    }

    const prayer = await Prayer.findById(prayerId);
    if (!prayer) return errorResponse(res, 'Prayer not found', 404);
    if (!prayer.charityEnabled) {
      return errorResponse(res, 'Charity is not enabled for this prayer');
    }

    const donation = await CharityDonation.create({
      prayerId,
      userId: req.userId || null,
      userName: userName || 'Anonymous',
      amount: Number(amount),
      upiTransactionId,
      message,
    });

    // Update collected amount
    await Prayer.findByIdAndUpdate(prayerId, {
      $inc: { charityCollectedAmount: Number(amount) },
    });

    // Broadcast donation to live viewers
    const io = getIO();
    if (io) {
      io.to(`prayer_${prayerId}`).emit('newDonation', {
        userName: donation.userName,
        amount: donation.amount,
        message: donation.message,
      });
    }

    return successResponse(res, donation, 'Donation recorded. Thank you!', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/prayers/:id/donations — get donations list
const getDonations = async (req, res) => {
  try {
    const donations = await CharityDonation.find({ prayerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const total = await CharityDonation.aggregate([
      { $match: { prayerId: require('mongoose').Types.ObjectId(req.params.id) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return successResponse(res, {
      donations,
      totalCollected: total[0]?.total || 0,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: get all comments for a prayer
const adminGetComments = async (req, res) => {
  try {
    const comments = await PrayerComment.find({ prayerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);
    return successResponse(res, comments);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: get all donations for a prayer
const adminGetDonations = async (req, res) => {
  try {
    const donations = await CharityDonation.find({ prayerId: req.params.id })
      .sort({ createdAt: -1 });

    const stats = {
      total: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      verified: donations.filter(d => d.isVerified).length,
    };

    return successResponse(res, { donations, stats });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: toggle comments on/off
const adminToggleComments = async (req, res) => {
  try {
    const { commentsEnabled } = req.body;
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { commentsEnabled },
      { new: true }
    );

    const io = getIO();
    if (io) {
      io.to(`prayer_${req.params.id}`).emit('commentsToggled', { commentsEnabled });
    }

    return successResponse(res, prayer, `Comments ${commentsEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: update YouTube link on live prayer
const adminUpdateYouTubeLink = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const videoId = extractYouTubeId(youtubeUrl);

    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { youtubeUrl, youtubeVideoId: videoId },
      { new: true }
    );

    const io = getIO();
    if (io) {
      io.to(`prayer_${req.params.id}`).emit('youtubeUpdated', {
        youtubeUrl,
        youtubeVideoId: videoId,
      });
    }

    return successResponse(res, prayer, 'YouTube link updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getPrayers,
  getLivePrayers,
  getPrayerById,
  createPrayer,
  updatePrayer,
  startPrayer,
  endPrayer,
  updateViewers,
  deletePrayer,
  getComments,
  addComment,
  likeComment,
  deleteComment,
  adminHideComment,
  adminPinComment,
  recordDonation,
  getDonations,
  adminGetComments,
  adminGetDonations,
  adminToggleComments,
  adminUpdateYouTubeLink,
};
