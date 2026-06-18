const Session = require('../models/Session');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const calculateCommission = require('../utils/calculateCommission');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @POST /api/sessions/start
const startSession = async (req, res) => {
  try {
    const { providerId, type } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return errorResponse(res, 'Provider not found', 404);
    if (!provider.isOnline) return errorResponse(res, 'Provider is offline');
    if (provider.verificationStatus !== 'verified') return errorResponse(res, 'Provider not verified');

    const commissionConfig = await Commission.findOne();
    let commissionRate = 5;
    if (commissionConfig) {
      if (type === 'chat') commissionRate = commissionConfig.chatCommission || 5;
      else if (type === 'call') commissionRate = commissionConfig.callCommission || 5;
      else if (type === 'video') commissionRate = commissionConfig.videoCommission || 5;
      else if (type === 'class') commissionRate = commissionConfig.educationCommission || 5;
    }

    const session = await Session.create({
      seekerId: req.userId,
      providerId,
      type,
      status: 'pending',
      pricePerMin: provider.pricePerMin,
      commissionRate,
      startTime: new Date(),
      religion: provider.religion,
    });

    return successResponse(res, session, 'Session started', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/sessions/:id/end
const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return errorResponse(res, 'Session not found', 404);

    const endTime = new Date();
    const durationMs = endTime - session.startTime;
    const durationMin = Math.ceil(durationMs / 60000);
    const totalAmount = durationMin * session.pricePerMin;

    const { commissionAmount, providerEarning } = calculateCommission(
      totalAmount,
      session.type,
      session.commissionRate
    );

    await Session.findByIdAndUpdate(session._id, {
      status: 'completed',
      endTime,
      duration: durationMin,
      totalAmount,
      commissionAmount,
      providerEarning,
      paymentStatus: 'paid',
    });

    // Update provider earnings
    await Provider.findByIdAndUpdate(session.providerId, {
      $inc: { totalEarned: providerEarning, walletBalance: providerEarning, totalSessions: 1 },
    });

    // Update user spending
    await User.findByIdAndUpdate(session.seekerId, {
      $inc: { totalSpent: totalAmount, totalSessions: 1, walletBalance: -totalAmount },
    });

    // Create a Transaction record
    await Transaction.create({
      userId: session.seekerId,
      providerId: session.providerId,
      sessionId: session._id,
      type: 'session_payment',
      amount: totalAmount,
      status: 'completed',
      commissionAmount,
      commissionRate: session.commissionRate,
      providerEarning,
      description: `Payment for consultation session ${session._id}`,
    });

    // Update global commissions collected
    await Commission.findOneAndUpdate(
      {},
      { $inc: { totalCollected: commissionAmount } },
      { upsert: true }
    );

    return successResponse(res, { session, totalAmount, commissionAmount, providerEarning }, 'Session ended');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/sessions/my
const getMySessions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.userType === 'user') filter.seekerId = req.userId;
    else filter.providerId = req.userId;

    if (status) filter.status = status;

    const sessions = await Session.find(filter)
      .populate('seekerId', 'name phone avatar')
      .populate('providerId', 'name avatar providerType rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Session.countDocuments(filter);

    return successResponse(res, { sessions, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { startSession, endSession, getMySessions };
