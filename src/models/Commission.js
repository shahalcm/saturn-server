const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  chatCommission: { type: Number, default: 5 },
  callCommission: { type: Number, default: 5 },
  videoCommission: { type: Number, default: 5 },
  educationCommission: { type: Number, default: 5 },
  courseCommission: { type: Number, default: 5 },
  totalCollected: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
