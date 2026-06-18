const mongoose = require('mongoose');

const prayerCommentSchema = new mongoose.Schema({
  prayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prayer',
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  userType: {
    type: String,
    enum: ['seeker', 'provider', 'anonymous'],
    default: 'seeker',
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  religion: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PrayerComment', prayerCommentSchema);
