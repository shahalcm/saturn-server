const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  religion: {
    type: String,
    enum: ['muslim', 'hindu', 'christian'],
    required: true,
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'],
  },
  subjects: [{ type: String }],
  price: { type: String, default: 'Free' },
  priceAmount: { type: Number, default: 0 },
  duration: { type: String },
  description: { type: String },
  curriculum: [{ week: Number, topic: String, lessons: [String] }],
  whatYouLearn: [{ type: String }],
  requirements: [{ type: String }],
  totalStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  thumbnail: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('EducationCourse', courseSchema);
