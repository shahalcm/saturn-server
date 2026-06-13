const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const filter = {
      $or: [
        { userId: req.userId },
        { userType: req.userType },
        { userType: 'all' },
      ],
    };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      notifications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return errorResponse(res, 'Notification not found', 404);
    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/notifications — admin only
const sendNotification = async (req, res) => {
  try {
    const { userId, userType, title, body, type, targetGroup, data } = req.body;

    const notification = await Notification.create({
      userId,
      userType,
      title,
      body,
      type,
      targetGroup,
      data,
      sentAt: new Date(),
    });

    // We can hook FCM push notification integration logic here if FCM token exists

    return successResponse(res, notification, 'Notification dispatched successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getNotifications, markRead, sendNotification };
