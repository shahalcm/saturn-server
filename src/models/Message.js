const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['user', 'provider'], required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio'],
    default: 'text',
  },
  fileUrl: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
