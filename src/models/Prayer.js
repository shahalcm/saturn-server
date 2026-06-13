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
  sendNotification: { type: Boolean, default: true },
  createdBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('Prayer', prayerSchema);
