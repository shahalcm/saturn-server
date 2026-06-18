const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  type: {
    type: String,
    enum: ['login', 'signup', 'reset', 'provider_signup', 'provider_login'],
    default: 'login',
  },
  isVerified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expires: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('OTP', otpSchema);
