const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  userType: { type: String, enum: ['seeker', 'provider'], required: true },
  userName: { type: String, required: true },
  userPhone: { type: String },
  userEmail: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'payment_issue',
      'session_issue',
      'provider_complaint',
      'technical_issue',
      'refund_request',
      'account_issue',
      'other',
    ],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  adminReply: { type: String },
  adminRepliedAt: { type: Date },
  repliedBy: { type: String },
  attachments: [{ type: String }],
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  resolvedAt: { type: Date },
  ticketNumber: { type: String, unique: true },
}, { timestamps: true });

// Auto generate ticket number
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `SAT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
