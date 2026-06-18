const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  prayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prayer',
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  amount: { type: Number, required: true },
  upiTransactionId: { type: String },
  message: { type: String },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CharityDonation', donationSchema);
