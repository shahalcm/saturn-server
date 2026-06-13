const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/chat/:sessionId/messages
const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ sessionId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, { messages: messages.reverse() });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/chat/:sessionId/messages
const sendMessage = async (req, res) => {
  try {
    const { content, type = 'text', receiverId } = req.body;
    const { sessionId } = req.params;

    const message = await Message.create({
      sessionId,
      senderId: req.userId,
      senderType: req.userType,
      receiverId,
      content,
      type,
    });

    return successResponse(res, message, 'Message sent', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.userId.toString() },
            { receiverId: req.userId.toString() },
          ],
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.userId.toString()] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', req.userId.toString()] }, { $eq: ['$isRead', false] }] },
                1, 0,
              ],
            },
          },
        },
      },
    ]);

    return successResponse(res, conversations);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/chat/read/:senderId
const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { senderId: req.params.senderId, receiverId: req.userId.toString(), isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return successResponse(res, null, 'Messages marked as read');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getMessages, sendMessage, getConversations, markAsRead };
