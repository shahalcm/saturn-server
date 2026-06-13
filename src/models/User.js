const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, minlength: 6 },
  avatar: { type: String, default: null },
  religion: { type: String, enum: ['muslim', 'hindu', 'christian'], default: null },
  gender: { type: String, enum: ['male', 'female', 'other'], default: null },
  languages: [{ type: String }],
  dateOfBirth: { type: Date },
  timeOfBirth: { type: String },
  placeOfBirth: { type: String },
  role: { type: String, enum: ['seeker', 'provider', 'admin'], default: 'seeker' },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  walletBalance: { type: Number, default: 0 },
  fcmToken: { type: String },
  whatsappUpdates: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
