const mongoose = require('mongoose');

const providerFeeSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true,
  },
  chatFee: { type: Number, default: 0, min: 0 },
  callFee: { type: Number, default: 0, min: 0 },
  videoFee: { type: Number, default: 0, min: 0 },
  consultationFee: { type: Number, default: 0, min: 0 },
  classFee: { type: Number, default: 0, min: 0 },
  commissionRate: { type: Number, default: 5 },
  effectiveFrom: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ProviderFee', providerFeeSchema);
