const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true,
  },
  accountHolderName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  confirmAccountNumber: { type: String, required: true, trim: true },
  ifscCode: { type: String, required: true, trim: true, uppercase: true },
  bankName: { type: String, required: true, trim: true },
  branchName: { type: String, trim: true },
  accountType: {
    type: String,
    enum: ['savings', 'current'],
    default: 'savings',
  },
  upiId: { type: String, trim: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BankDetails', bankDetailsSchema);
