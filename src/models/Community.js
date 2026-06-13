const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  content: { type: String, required: true },
  religion: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
  }],
  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Community', communitySchema);
