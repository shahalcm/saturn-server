const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  userType: { type: String, enum: ['user', 'provider', 'all'] },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['general', 'prayer_alert', 'session', 'payment', 'offer', 'system'],
    default: 'general',
  },
  targetGroup: { type: String },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  delivered: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
