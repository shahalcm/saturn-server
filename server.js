const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const errorMiddleware = require('./src/middleware/errorMiddleware');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const providerRoutes = require('./src/routes/providerRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const prayerRoutes = require('./src/routes/prayerRoutes');
const educationRoutes = require('./src/routes/educationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const communityRoutes = require('./src/routes/communityRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const advertisementRoutes = require('./src/routes/advertisementRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const agoraRoutes = require('./src/routes/agoraRoutes');
const supportRoutes = require('./src/routes/supportRoutes');
const bankRoutes = require('./src/routes/bankRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const feeRoutes = require('./src/routes/feeRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.ADMIN_URL, '*'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/prayers', prayerRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/fees', feeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Saturn API running on port ${PORT}`);
});

module.exports = { app, io };
