const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  chatCommission: { type: Number, default: 15 },
  callCommission: { type: Number, default: 15 },
  videoCommission: { type: Number, default: 15 },
  educationCommission: { type: Number, default: 15 },
  totalCollected: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
