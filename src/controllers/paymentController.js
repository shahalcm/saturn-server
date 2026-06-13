const razorpay = require('../config/razorpay');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Provider = require('../models/Provider');
const crypto = require('crypto');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @POST /api/payments/order
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    if (!amount) return errorResponse(res, 'Amount is required');

    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return successResponse(res, order, 'Razorpay order created');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !amount) {
      return errorResponse(res, 'Missing signature fields or amount');
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Top up wallet balance
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    // Save transaction
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'wallet_topup',
      amount,
      status: 'completed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      description: `Wallet top-up of INR ${amount}`,
    });

    return successResponse(res, { walletBalance: user.walletBalance, transaction }, 'Payment verified, wallet topped up');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/payments/payout
const payout = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return errorResponse(res, 'Valid amount is required');

    const provider = await Provider.findById(req.userId);
    if (!provider) return errorResponse(res, 'Provider not found', 404);

    if (provider.walletBalance < amount) {
      return errorResponse(res, 'Insufficient wallet balance', 400);
    }

    // Decrement wallet balance
    provider.walletBalance -= amount;
    await provider.save();

    // Create payout transaction
    const transaction = await Transaction.create({
      providerId: req.userId,
      type: 'provider_payout',
      amount,
      status: 'completed',
      description: `Payout of INR ${amount} to provider account`,
    });

    return successResponse(res, { walletBalance: provider.walletBalance, transaction }, 'Payout processed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/payments/history
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.userType === 'user') {
      filter.userId = req.userId;
    } else {
      filter.providerId = req.userId;
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { createOrder, verifyPayment, payout, getTransactions };
