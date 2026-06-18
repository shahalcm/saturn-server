const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Provider = require('../models/Provider');
const nodemailer = require('nodemailer');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_EMAIL_PASSWORD,
  },
});

// Send email notification
const sendSupportEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Saturn Support" <${process.env.SUPPORT_EMAIL}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error('Email error:', e.message);
  }
};

// @POST /api/support/tickets — create ticket
const createTicket = async (req, res) => {
  try {
    const {
      subject,
      message,
      category,
      userType,
      sessionId,
    } = req.body;

    if (!subject || !message) {
      return errorResponse(res, 'Subject and message are required');
    }

    let userName = '';
    let userPhone = '';
    let userEmail = '';
    let userId = null;
    let providerId = null;

    if (userType === 'seeker') {
      const user = await User.findById(req.userId);
      if (user) {
        userName = user.name;
        userPhone = user.phone;
        userEmail = user.email;
        userId = user._id;
      }
    } else if (userType === 'provider') {
      const provider = await Provider.findById(req.userId);
      if (provider) {
        userName = provider.name;
        userPhone = provider.phone;
        userEmail = provider.email;
        providerId = provider._id;
      }
    }

    const ticket = await SupportTicket.create({
      userId,
      providerId,
      userType,
      userName,
      userPhone,
      userEmail,
      subject,
      message,
      category: category || 'other',
      sessionId: sessionId || null,
    });

    // Send confirmation email to user
    if (userEmail) {
      await sendSupportEmail(
        userEmail,
        `Support Ticket #${ticket.ticketNumber} Created`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #F5A623, #E8841A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Saturn Support</h1>
          </div>
          <div style="background: #F9F9F9; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
            <p>Your support ticket has been created successfully. Our team will get back to you within 24 hours.</p>
            <div style="background: white; border-radius: 10px; padding: 16px; margin: 16px 0; border-left: 4px solid #F5A623;">
              <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Status:</strong> Open</p>
            </div>
            <p>For immediate assistance, contact us at:</p>
            <p>📞 <strong>9544755008</strong></p>
            <p>📧 <strong>ubsimportingexporting@gmail.com</strong></p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Saturn Astrology Platform</p>
          </div>
        </div>
        `
      );
    }

    // Notify admin
    await sendSupportEmail(
      process.env.ADMIN_SUPPORT_EMAIL || 'ubsimportingexporting@gmail.com',
      `New Support Ticket #${ticket.ticketNumber} — ${subject}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D1B2A; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #F5A623; margin: 0; font-size: 22px;">New Support Ticket</h1>
        </div>
        <div style="background: #F9F9F9; padding: 24px; border-radius: 0 0 12px 12px;">
          <div style="background: white; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>From:</strong> ${userName} (${userType})</p>
            <p><strong>Phone:</strong> ${userPhone}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="background: #F5F5F5; padding: 12px; border-radius: 8px;">${message}</p>
          </div>
          <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/support" 
             style="background: #F5A623; color: white; padding: 12px 24px; 
                    border-radius: 8px; text-decoration: none; font-weight: bold;">
            View in Admin Panel
          </a>
        </div>
      </div>
      `
    );

    return successResponse(res, ticket, 'Support ticket created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/support/tickets/my — get my tickets
const getMyTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.userType === 'user') filter.userId = req.userId;
    else filter.providerId = req.userId;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 });

    return successResponse(res, tickets);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/support/tickets/:id — get single ticket
const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);
    return successResponse(res, ticket);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN CONTROLLERS

// @GET /api/admin/support/tickets
const getAllTickets = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      userType,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (userType) filter.userType = userType;
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { userPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
    };

    return successResponse(res, { tickets, total, stats });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/support/tickets/:id/reply
const replyToTicket = async (req, res) => {
  try {
    const { reply, status, priority } = req.body;

    if (!reply) return errorResponse(res, 'Reply message is required');

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        adminReply: reply,
        adminRepliedAt: new Date(),
        repliedBy: 'Admin',
        status: status || 'in_progress',
        priority: priority || undefined,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    // Send reply email to user
    const userEmail = ticket.userEmail;
    if (userEmail) {
      await sendSupportEmail(
        userEmail,
        `Re: Support Ticket #${ticket.ticketNumber} — ${ticket.subject}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #F5A623, #E8841A); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Saturn Support Reply</h1>
          </div>
          <div style="background: #F9F9F9; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Hello <strong>${ticket.userName}</strong>,</p>
            <p>Our support team has replied to your ticket <strong>#${ticket.ticketNumber}</strong>.</p>
            
            <div style="background: white; border-radius: 10px; padding: 16px; margin: 16px 0; border-left: 4px solid #F5A623;">
              <p><strong>Admin Reply:</strong></p>
              <p style="font-size: 15px; line-height: 1.6;">${reply}</p>
            </div>

            <div style="background: #F5F5F5; border-radius: 10px; padding: 12px; margin-top: 16px;">
              <p style="margin: 0; font-size: 13px; color: #666;">
                Status: <strong>${status || 'In Progress'}</strong>
              </p>
            </div>

            <p style="margin-top: 20px;">If you have more questions, contact us:</p>
            <p>📞 <strong>9544755008</strong></p>
            <p>📧 <strong>ubsimportingexporting@gmail.com</strong></p>
          </div>
        </div>
        `
      );
    }

    return successResponse(res, ticket, 'Reply sent successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/admin/support/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
      { new: true }
    );
    return successResponse(res, ticket, 'Ticket updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/admin/support/tickets/:id
const deleteTicket = async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Ticket deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
  deleteTicket,
};
