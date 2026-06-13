const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String },
  targetReligion: {
    type: String,
    enum: ['all', 'muslim', 'hindu', 'christian'],
    default: 'all',
  },
  position: {
    type: String,
    enum: ['home_banner', 'between_cards', 'prayer_banner'],
    default: 'home_banner',
  },
  linkUrl: { type: String },
  status: {
    type: String,
    enum: ['active', 'paused', 'expired'],
    default: 'active',
  },
  startDate: { type: Date },
  endDate: { type: Date },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  createdBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', adSchema);
