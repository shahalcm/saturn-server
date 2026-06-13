const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  type: {
    type: String,
    enum: ['session_payment', 'wallet_topup', 'provider_payout', 'refund', 'commission'],
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  commissionAmount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 15 },
  providerEarning: { type: Number, default: 0 },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
