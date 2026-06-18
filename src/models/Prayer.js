const mongoose = require('mongoose');

const prayerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  religion: {
    type: String,
    enum: ['muslim', 'hindu', 'christian'],
    required: true,
  },
  host: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },

  // YouTube Live
  youtubeUrl: { type: String },
  youtubeVideoId: { type: String },
  streamUrl: { type: String },

  description: { type: String },
  recurrence: {
    type: String,
    enum: ['one-time', 'daily', 'weekly'],
    default: 'one-time',
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  viewers: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  sendNotification: { type: Boolean, default: true },

  // Comments
  commentsEnabled: { type: Boolean, default: true },
  totalComments: { type: Number, default: 0 },

  // Charity / Donation
  charityEnabled: { type: Boolean, default: false },
  charityTitle: { type: String },
  charityDescription: { type: String },
  charityGoalAmount: { type: Number, default: 0 },
  charityCollectedAmount: { type: Number, default: 0 },
  googlePayQrCode: { type: String },
  googlePayUpiId: { type: String },
  googlePayName: { type: String },

  createdBy: { type: String, default: 'admin' },
}, { timestamps: true });

// Extract YouTube video ID from URL
prayerSchema.pre('save', function(next) {
  if (this.youtubeUrl) {
    const url = this.youtubeUrl;
    let videoId = null;

    // Handle different YouTube URL formats
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('live/')) {
      videoId = url.split('live/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (videoId) {
      this.youtubeVideoId = videoId;
    }
  }
  next();
});

module.exports = mongoose.model('Prayer', prayerSchema);
