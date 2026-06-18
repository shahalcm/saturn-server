const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  providerName: { type: String },
  providerType: { type: String },
  amount: { type: Number, required: true, min: 100 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending',
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountType: String,
    upiId: String,
  },
  requestNumber: { type: String, unique: true },
  adminNote: { type: String },
  transactionId: { type: String },
  processedAt: { type: Date },
  processedBy: { type: String },
  rejectionReason: { type: String },
}, { timestamps: true });

withdrawalSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('WithdrawalRequest').countDocuments();
    this.requestNumber = `WD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalSchema);
