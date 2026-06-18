const mongoose = require('mongoose');

const providerCourseSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  providerName: { type: String },
  providerType: { type: String },
  religion: {
    type: String,
    enum: ['muslim', 'hindu', 'christian'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'],
    default: 'All levels',
  },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  duration: { type: String },
  totalWeeks: { type: Number, default: 4 },
  maxStudents: { type: Number, default: 50 },
  thumbnail: { type: String },
  curriculum: [{
    week: Number,
    topic: String,
    lessons: [String],
  }],
  whatYouLearn: [{ type: String }],
  requirements: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isApproved: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  enrolledStudents: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 5 },
  totalCommissionPaid: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  meetLink: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ProviderCourse', providerCourseSchema);
