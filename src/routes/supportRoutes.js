const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
  deleteTicket,
} = require('../controllers/supportController');

// User/Provider routes
router.post('/tickets', protect, createTicket);
router.get('/tickets/my', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicketById);

// Admin routes
router.get('/admin/tickets', adminProtect, getAllTickets);
router.put('/admin/tickets/:id/reply', adminProtect, replyToTicket);
router.put('/admin/tickets/:id/status', adminProtect, updateTicketStatus);
router.delete('/admin/tickets/:id', adminProtect, deleteTicket);

module.exports = router;
