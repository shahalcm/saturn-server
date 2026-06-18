const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderCourse', required: true },
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  amountPaid: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  providerEarning: { type: Number, default: 0 },
  paymentId: { type: String },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('CourseEnrollment', enrollmentSchema);
