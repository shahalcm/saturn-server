const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String },
  avatar: { type: String, default: null },
  providerType: {
    type: String,
    enum: ['astrologer', 'doctor', 'teacher'],
    required: true,
  },
  religion: {
    type: String,
    enum: ['muslim', 'hindu', 'christian'],
    required: true,
  },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  languages: [{ type: String }],
  location: { type: String },
  experience: { type: Number, default: 0 },
  specialties: [{ type: String }],
  qualification: { type: String },
  about: { type: String },
  pricePerMin: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending',
  },
  rejectionReason: { type: String },
  documents: [{ type: String }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  fcmToken: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

providerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

providerSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Provider', providerSchema);
