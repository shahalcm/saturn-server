let io;
const activeUsers = new Map(); // userId → socketId

const initSocket = (socketio) => {
  io = socketio;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} joined`);

      // Broadcast online status to all
      io.emit('userOnline', { userId });
    });

    // Provider goes online/offline
    socket.on('providerStatus', ({ providerId, isOnline }) => {
      io.emit('providerStatusUpdate', { providerId, isOnline });
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, message, sessionId } = data;

      const msgData = {
        senderId,
        receiverId,
        message,
        sessionId,
        timestamp: new Date(),
        isRead: false,
      };

      // Emit to receiver
      io.to(receiverId).emit('receiveMessage', msgData);
      // Emit back to sender for confirmation
      socket.emit('messageSent', msgData);
    });

    // Typing indicator
    socket.on('typing', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('userTyping', { senderId });
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('userStopTyping', { senderId });
    });

    // Message read
    socket.on('messageRead', ({ messageId, readerId, senderId }) => {
      io.to(senderId).emit('messageReadUpdate', { messageId, readerId });
    });

    // Session events
    socket.on('sessionStart', ({ sessionId, seekerId, providerId }) => {
      io.to(seekerId).emit('sessionStarted', { sessionId });
      io.to(providerId).emit('sessionStarted', { sessionId });
    });

    socket.on('sessionEnd', ({ sessionId, seekerId, providerId }) => {
      io.to(seekerId).emit('sessionEnded', { sessionId });
      io.to(providerId).emit('sessionEnded', { sessionId });
    });

    // Call signaling (WebRTC)
    socket.on('callOffer', ({ to, offer, from }) => {
      io.to(to).emit('incomingCall', { from, offer });
    });

    socket.on('callAnswer', ({ to, answer }) => {
      io.to(to).emit('callAnswered', { answer });
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
      io.to(to).emit('iceCandidate', { candidate });
    });

    socket.on('callRejected', ({ to }) => {
      io.to(to).emit('callRejected');
    });

    socket.on('callEnded', ({ to }) => {
      io.to(to).emit('callEnded');
    });

    // Disconnect
    socket.on('disconnect', () => {
      activeUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          io.emit('userOffline', { userId });
        }
      });
      console.log('Socket disconnected:', socket.id);
    });
  });
};

const getIO = () => io;
const getActiveUsers = () => activeUsers;

module.exports = { initSocket, getIO, getActiveUsers };
