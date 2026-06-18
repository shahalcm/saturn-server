const Provider = require('../models/Provider');
const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Commission = require('../models/Commission');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @GET /api/providers — get all verified providers
const getProviders = async (req, res) => {
  try {
    const { type, religion, language, specialty, isOnline, page = 1, limit = 20 } = req.query;

    const filter = { verificationStatus: 'verified', isBanned: false };

    if (type) filter.providerType = type;
    if (religion) filter.religion = religion;
    if (language) filter.languages = { $in: [language] };
    if (specialty) filter.specialties = { $in: [specialty] };
    if (isOnline === 'true') filter.isOnline = true;

    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .select('-password')
      .sort({ isOnline: -1, rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      providers,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/:id
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    if (!provider) return errorResponse(res, 'Provider not found', 404);
    return successResponse(res, provider);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/profile
const updateProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      req.body,
      { new: true }
    ).select('-password');
    return successResponse(res, provider, 'Profile updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/status
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      { isOnline, lastActive: new Date() },
      { new: true }
    );
    return successResponse(res, { isOnline: provider.isOnline }, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/documents
const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return errorResponse(res, 'No files uploaded');

    const urls = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'saturn/documents',
      });
      urls.push(result.secure_url);
      fs.unlinkSync(file.path);
    }

    const provider = await Provider.findByIdAndUpdate(
      req.userId,
      { $push: { documents: { $each: urls } } },
      { new: true }
    );

    return successResponse(res, { documents: provider.documents }, 'Documents uploaded');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/providers/register
const registerProvider = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      providerType,
      religion,
      gender,
      languages,
      location,
      experience,
      price,
      about,
      specialties,
      qualification,
      uploadedDoc
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let existingProvider = await Provider.findOne({ $or: [{ phone: phone || user.phone }, { userId: user._id }] });
    if (existingProvider) {
      return errorResponse(res, 'Provider profile already exists', 400);
    }

    user.role = 'provider';
    await user.save();

    const provider = await Provider.create({
      userId: user._id,
      name: name || user.name,
      phone: phone || user.phone,
      email: email || user.email,
      providerType,
      religion,
      gender,
      languages,
      location,
      experience: Number(experience) || 0,
      pricePerMin: Number(price) || 0,
      about,
      specialties: Array.isArray(specialties) ? specialties : [specialties].filter(Boolean),
      qualification,
      documents: uploadedDoc ? [uploadedDoc] : [],
      isPhoneVerified: true,
      verificationStatus: 'pending',
    });

    const token = generateToken(provider._id, 'provider');
    const refreshToken = generateRefreshToken(provider._id);

    return successResponse(res, {
      token,
      refreshToken,
      provider: {
        id: provider._id,
        name: provider.name,
        phone: provider.phone,
        providerType: provider.providerType,
        religion: provider.religion,
        verificationStatus: provider.verificationStatus,
      }
    }, 'Provider registered successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/profile — provider gets own profile
const getMyProfile = async (req, res) => {
  try {
    const provider = await Provider.findById(req.userId).select('-password');
    if (!provider) return errorResponse(res, 'Provider not found', 404);
    return successResponse(res, provider);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/earnings
const getEarnings = async (req, res) => {
  try {
    const sessions = await Session.find({
      providerId: req.userId,
      status: 'completed',
    });

    const totalEarned = sessions.reduce((sum, s) => sum + (s.providerEarning || 0), 0);
    const thisMonth = sessions
      .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, s) => sum + (s.providerEarning || 0), 0);
    const lastMonth = sessions
      .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth() - 1)
      .reduce((sum, s) => sum + (s.providerEarning || 0), 0);

    const chatEarnings = sessions.filter(s => s.type === 'chat').reduce((sum, s) => sum + s.providerEarning, 0);
    const callEarnings = sessions.filter(s => s.type === 'call').reduce((sum, s) => sum + s.providerEarning, 0);
    const videoEarnings = sessions.filter(s => s.type === 'video').reduce((sum, s) => sum + s.providerEarning, 0);
    const classEarnings = sessions.filter(s => s.type === 'class').reduce((sum, s) => sum + s.providerEarning, 0);

    const commissionConfig = await Commission.findOne();
    const commissionRate = commissionConfig?.chatCommission || 5;
    const totalCommission = sessions.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

    return successResponse(res, {
      totalEarned,
      thisMonth,
      lastMonth,
      chatEarnings,
      callEarnings,
      videoEarnings,
      classEarnings,
      totalCommission,
      commissionRate,
      netEarnings: totalEarned,
      transactions: sessions.map(s => ({
        id: s._id,
        seekerName: s.seekerName || 'Seeker',
        type: s.type,
        amount: s.providerEarning,
        date: s.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.userId })
      .populate('seekerId', 'name avatar')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
      percentage: totalReviews > 0
        ? Math.round((reviews.filter(r => r.rating === star).length / totalReviews) * 100)
        : 0,
    }));

    return successResponse(res, {
      reviews,
      totalReviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      ratingBreakdown,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/reviews — seeker submits review after session
const createReview = async (req, res) => {
  try {
    const { sessionId, providerId, rating, review } = req.body;

    const existing = await Review.findOne({ sessionId, seekerId: req.userId });
    if (existing) return errorResponse(res, 'Review already submitted');

    const newReview = await Review.create({
      sessionId,
      seekerId: req.userId,
      providerId,
      rating,
      review,
    });

    // Update provider rating
    const allReviews = await Review.find({ providerId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Provider.findByIdAndUpdate(providerId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length,
    });

    return successResponse(res, newReview, 'Review submitted', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/providers/fcm-token
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await Provider.findByIdAndUpdate(req.userId, { fcmToken });
    return successResponse(res, null, 'FCM token updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/providers/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const providerId = req.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allSessions, todaySessions, reviews, provider] = await Promise.all([
      Session.find({ providerId, status: 'completed' }),
      Session.find({ providerId, status: 'completed', createdAt: { $gte: today } }),
      Review.find({ providerId }),
      Provider.findById(providerId),
    ]);

    const totalEarned = allSessions.reduce((sum, s) => sum + (s.providerEarning || 0), 0);
    const todayEarned = todaySessions.reduce((sum, s) => sum + (s.providerEarning || 0), 0);

    const upcomingSessions = await Session.find({
      providerId,
      status: 'pending',
    })
      .populate('seekerId', 'name avatar phone')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = await Review.find({ providerId })
      .populate('seekerId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(3);

    return successResponse(res, {
      totalSessions: allSessions.length,
      todaySessions: todaySessions.length,
      totalEarned,
      todayEarned,
      rating: provider?.rating || 0,
      totalReviews: reviews.length,
      upcomingSessions,
      recentReviews,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  getMyProfile,
  updateProviderProfile,
  updateOnlineStatus,
  uploadDocuments,
  getEarnings,
  getMyReviews,
  updateFCMToken,
  getDashboardStats,
  registerProvider,
  createReview,
};
