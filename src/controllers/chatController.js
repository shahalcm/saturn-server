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

// Heuristic response generator for Saturn AI Assistant
const getAIResponse = (userMessageText, aiResponseCount) => {
  if (aiResponseCount >= 3) {
    return null; // Stop responding after 3 responses
  }

  // If this is the third message (count is 2), send the handover warning
  if (aiResponseCount === 2) {
    return "Thank you for your patience. A service provider will continue this conversation shortly.";
  }

  const text = userMessageText.toLowerCase().trim();

  // Rule 6: Complex, personal, legal, medical, financial, or provider-specific questions
  // Immediately say: "Thank you for your message. A service provider will join shortly to assist you further."
  const complexKeywords = [
    'personal', 'legal', 'medical', 'financial', 'lawyer', 'doctor', 'prescribe', 'medicine', 'sick',
    'investment', 'stock', 'diagnose', 'disease', 'advise', 'counsel', 'court', 'case', 'wealth',
    'tax', 'symptom', 'pain', 'heart', 'depressed', 'anxiety', 'diagnostics', 'advice', 'problem',
    'help me', 'heal', 'cure', 'cancer', 'legal case', 'judge', 'stock market', 'crypto'
  ];

  const wordCount = userMessageText.split(/\s+/).filter(Boolean).length;

  const isComplex = complexKeywords.some(kw => text.includes(kw)) || wordCount > 15;

  if (isComplex) {
    return "Thank you for your message. A service provider will join shortly to assist you further.";
  }

  // Rule 4 & 7: Pricing, services, availability, booking, or consultation
  // Pricing examples:
  const pricingKeywords = ['charge', 'pricing', 'price', 'fee', 'cost', 'payment', 'pay', 'rate', 'how much'];
  if (pricingKeywords.some(kw => text.includes(kw))) {
    return "Charges may vary depending on the provider and service selected. A provider can give you exact pricing shortly.";
  }

  // Booking/consultation examples:
  const bookingKeywords = ['book', 'booking', 'schedule', 'reserve', 'appointment', 'consultation', 'consult', 'meet', 'join', 'service', 'class', 'course', 'session', 'call', 'video', 'chat'];
  if (bookingKeywords.some(kw => text.includes(kw))) {
    return "We'd be happy to help. Could you briefly describe what kind of assistance you're looking for?";
  }

  // Greetings:
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'morning', 'evening', 'afternoon', 'hola', 'yo', 'sup'];
  if (greetings.some(kw => text.startsWith(kw) || text === kw)) {
    return "Hello! Welcome to Saturn. How may I assist you today?";
  }

  // Default friendly/general response
  return "Hello! Welcome to Saturn. How may I assist you today?";
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

    // Return the response immediately to the seeker
    successResponse(res, message, 'Message sent', 201);

    // Run the AI assistant in the background
    if (req.userType === 'user') {
      setTimeout(async () => {
        try {
          // Check if a real provider has ever sent a message in this session
          const realProviderJoined = await Message.exists({
            sessionId,
            senderType: 'provider',
            isAI: false
          });

          if (!realProviderJoined) {
            // Count how many AI messages have already been sent in this session
            const aiCount = await Message.countDocuments({
              sessionId,
              senderType: 'provider',
              isAI: true
            });

            // Get AI Response
            const aiResponse = getAIResponse(content, aiCount);

            if (aiResponse) {
              const aiMessage = await Message.create({
                sessionId,
                senderId: receiverId, // Formatted as from the provider
                senderType: 'provider',
                receiverId: req.userId,
                content: aiResponse,
                type: 'text',
                isAI: true,
              });

              // Emit to receiver (the seeker, i.e., req.userId) via Socket.IO
              const { getIO } = require('../config/socket');
              const io = getIO();
              if (io) {
                io.to(req.userId).emit('receiveMessage', {
                  _id: aiMessage._id,
                  sessionId,
                  senderId: receiverId,
                  senderType: 'provider',
                  receiverId: req.userId,
                  content: aiResponse,
                  message: aiResponse,
                  isAI: true,
                  createdAt: aiMessage.createdAt,
                });
              }
            }
          }
        } catch (err) {
          console.warn('AI Assistant error:', err);
        }
      }, 500); // 500ms delay to make it feel natural
    }

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
