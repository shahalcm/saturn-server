const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  type: {
    type: String,
    enum: ['chat', 'call', 'video', 'class'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'completed', 'cancelled'],
    default: 'pending',
  },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // minutes
  pricePerMin: { type: Number, required: true },
  totalAmount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 15 },
  commissionAmount: { type: Number, default: 0 },
  providerEarning: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentId: { type: String },
  orderId: { type: String },
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['seeker', 'provider', 'admin'] },
  notes: { type: String },
  religion: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
