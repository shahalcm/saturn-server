const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
