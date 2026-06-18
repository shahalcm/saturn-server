const User = require('../models/User');
const Provider = require('../models/Provider');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const Prayer = require('../models/Prayer');
const Advertisement = require('../models/Advertisement');
const Notification = require('../models/Notification');
const Community = require('../models/Community');
const Review = require('../models/Review');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'seeker' });
    const totalProviders = await Provider.countDocuments();
    const pendingVerifications = await Provider.countDocuments({ verificationStatus: 'pending' });
    const totalSessions = await Session.countDocuments();
    
    // Sum complete transactions
    const revenueStats = await Transaction.aggregate([
      { $match: { status: 'completed', type: { $in: ['session_payment', 'wallet_topup'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Calculate today's revenue (since 00:00:00 local time)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRevenueStats = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          type: { $in: ['session_payment', 'wallet_topup'] },
          createdAt: { $gte: startOfToday }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayRevenue = todayRevenueStats[0]?.total || 0;

    // Count non-banned seekers as active users
    const activeUsers = await User.countDocuments({ role: 'seeker', isBanned: false });

    // Commission total
    const commConfig = await Commission.findOne();
    const totalCommission = commConfig?.totalCollected || 0;

    return successResponse(res, {
      totalUsers,
      totalProviders,
      pendingVerifications,
      totalSessions,
      totalRevenue,
      todayRevenue,
      activeUsers,
      totalCommission,
    }, 'Dashboard stats retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/verifications
const getVerificationRequests = async (req, res) => {
  try {
    const requests = await Provider.find({ verificationStatus: 'pending' }).select('-password');
    return successResponse(res, requests);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/providers/:id/verify
const verifyProvider = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['verified', 'rejected', 'suspended'].includes(status)) {
      return errorResponse(res, 'Invalid verification status');
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, rejectionReason: reason },
      { new: true }
    ).select('-password');

    if (!provider) return errorResponse(res, 'Provider not found', 404);

    return successResponse(res, provider, `Provider verification set to ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned, banReason: reason },
      { new: true }
    ).select('-password');

    if (!user) return errorResponse(res, 'User not found', 404);

    return successResponse(res, user, isBanned ? 'User banned successfully' : 'User unbanned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/providers/:id/ban
const banProvider = async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isBanned, rejectionReason: reason },
      { new: true }
    ).select('-password');

    if (!provider) return errorResponse(res, 'Provider not found', 404);

    return successResponse(res, provider, isBanned ? 'Provider banned successfully' : 'Provider unbanned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/commission
const updateCommission = async (req, res) => {
  try {
    const { chatCommission, callCommission, videoCommission, educationCommission } = req.body;

    const commission = await Commission.findOneAndUpdate(
      {},
      { chatCommission, callCommission, videoCommission, educationCommission },
      { new: true, upsert: true }
    );

    return successResponse(res, commission, 'Commission rates updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/commission
const getCommission = async (req, res) => {
  try {
    const commission = await Commission.findOne();
    if (!commission) {
      const defaultComm = await Commission.create({
        chatCommission: 15,
        callCommission: 15,
        videoCommission: 15,
        educationCommission: 15,
      });
      return successResponse(res, defaultComm);
    }
    return successResponse(res, commission);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'seeker' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return successResponse(res, { users, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/providers
const getAllProviders = async (req, res) => {
  try {
    const { search, providerType, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (providerType) filter.providerType = providerType;
    if (status) filter.verificationStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return successResponse(res, { providers, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/sessions
const getAllSessions = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .populate('seekerId', 'name phone avatar')
      .populate('providerId', 'name avatar providerType rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return successResponse(res, { sessions, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/prayers
const getAllPrayers = async (req, res) => {
  try {
    const { religion, status } = req.query;
    const filter = {};
    if (religion) filter.religion = religion;
    if (status) filter.status = status;
    const prayers = await Prayer.find(filter).sort({ scheduledDate: -1 });
    return successResponse(res, { prayers, total: prayers.length });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/advertisements
const getAdvertisements = async (req, res) => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    return successResponse(res, { ads, total: ads.length });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/admin/advertisements
const createAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.create(req.body);
    return successResponse(res, ad, 'Ad created', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/advertisements/:id
const updateAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return successResponse(res, ad, 'Ad updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/admin/advertisements/:id
const deleteAdvertisement = async (req, res) => {
  try {
    await Advertisement.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Ad deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/revenue-stats
const getRevenueStats = async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'completed' });
    const last10Days = [];

    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySessions = sessions.filter(s =>
        new Date(s.createdAt) >= date && new Date(s.createdAt) < nextDate
      );

      last10Days.push({
        date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: daySessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        sessions: daySessions.length,
        commission: daySessions.reduce((sum, s) => sum + (s.commissionAmount || 0), 0),
      });
    }

    const religiousBreakdown = ['hindu', 'muslim', 'christian'].map(religion => ({
      religion,
      revenue: sessions
        .filter(s => s.religion === religion)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    }));

    const typeBreakdown = ['chat', 'call', 'video', 'class'].map(type => ({
      type,
      count: sessions.filter(s => s.type === type).length,
      revenue: sessions.filter(s => s.type === type).reduce((sum, s) => sum + s.totalAmount, 0),
    }));

    return successResponse(res, { last10Days, religiousBreakdown, typeBreakdown });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    return successResponse(res, notifications);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/admin/notifications/send
const sendNotification = async (req, res) => {
  try {
    const { title, body, targetGroup, type, scheduledAt, userId } = req.body;

    if (userId) {
      const notification = await Notification.create({
        userId,
        title,
        body,
        targetGroup: 'individual',
        type: 'system',
        sentAt: new Date(),
        delivered: 1,
      });
      return successResponse(res, notification, 'Individual warning sent', 201);
    }

    // Count target users
    let targetCount = 0;
    if (targetGroup === 'all') {
      targetCount = await User.countDocuments({ isBanned: false });
    } else if (['muslim', 'hindu', 'christian'].includes(targetGroup)) {
      targetCount = await User.countDocuments({ religion: targetGroup, isBanned: false });
    } else if (targetGroup === 'seekers') {
      targetCount = await User.countDocuments({ role: 'seeker', isBanned: false });
    } else if (targetGroup === 'providers') {
      targetCount = await Provider.countDocuments({ isBanned: false });
    }

    const notification = await Notification.create({
      title,
      body,
      targetGroup,
      type: type || 'general',
      scheduledAt: scheduledAt || null,
      sentAt: scheduledAt ? null : new Date(),
      delivered: targetCount,
    });

    return successResponse(res, notification, 'Notification sent', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/community
const getCommunityPosts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };
    if (status === 'reported') filter.isReported = true;
    if (status === 'hidden') filter.isHidden = true;

    const posts = await Community.find(filter)
      .populate('authorId', 'name avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, posts);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/community/:id/hide
const hidePost = async (req, res) => {
  try {
    const isHidden = req.body.isHidden !== undefined ? req.body.isHidden : true;
    const post = await Community.findByIdAndUpdate(
      req.params.id,
      { isHidden },
      { new: true }
    );
    return successResponse(res, post, isHidden ? 'Post hidden' : 'Post restored');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/admin/community/:id
const deletePost = async (req, res) => {
  try {
    await Community.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return successResponse(res, null, 'Post deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/providers/:id
const getProviderByIdAdmin = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    if (!provider) return errorResponse(res, 'Provider not found', 404);

    // Find sessions for this provider
    const sessions = await Session.find({ providerId: provider._id })
      .populate('seekerId', 'name avatar')
      .sort({ createdAt: -1 });

    // Find reviews for this provider
    const reviews = await Review.find({ providerId: provider._id })
      .populate('seekerId', 'name avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, { provider, sessions, reviews });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return errorResponse(res, 'User not found', 404);

    // Find sessions for this user
    const sessions = await Session.find({ seekerId: user._id })
      .populate('providerId', 'name avatar providerType')
      .sort({ createdAt: -1 });

    return successResponse(res, { user, sessions });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getDashboardStats,
  getVerificationRequests,
  verifyProvider,
  banUser,
  banProvider,
  updateCommission,
  getCommission,
  getAllUsers,
  getUserById,
  getAllProviders,
  getProviderByIdAdmin,
  getAllSessions,
  getAllPrayers,
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  getRevenueStats,
  getNotifications,
  sendNotification,
  getCommunityPosts,
  hidePost,
  deletePost,
};
