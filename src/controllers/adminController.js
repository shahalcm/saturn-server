const User = require('../models/User');
const Provider = require('../models/Provider');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/admin/stats
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

    // Commission total
    const commConfig = await Commission.findOne();
    const totalCommission = commConfig?.totalCollected || 0;

    return successResponse(res, {
      totalUsers,
      totalProviders,
      pendingVerifications,
      totalSessions,
      totalRevenue,
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
const updateCommissionRates = async (req, res) => {
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
const getCommissionStats = async (req, res) => {
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

module.exports = {
  getDashboardStats,
  getVerificationRequests,
  verifyProvider,
  banUser,
  banProvider,
  updateCommissionRates,
  getCommissionStats,
  getAllUsers,
  getAllProviders,
  getAllSessions,
};
