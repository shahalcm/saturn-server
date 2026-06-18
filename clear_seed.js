const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Provider = require('./src/models/Provider');
const Session = require('./src/models/Session');
const Transaction = require('./src/models/Transaction');
const Commission = require('./src/models/Commission');
const Prayer = require('./src/models/Prayer');
const EducationCourse = require('./src/models/EducationCourse');
const Community = require('./src/models/Community');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');

async function clear() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    console.log('Clearing mock data and restoring original state...');
    await User.deleteMany({});
    await Session.deleteMany({});
    await Transaction.deleteMany({});
    await Prayer.deleteMany({});
    await EducationCourse.deleteMany({});
    await Community.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    // Reset commission config
    await Commission.deleteMany({});
    await Commission.create({
      chatCommission: 15,
      callCommission: 15,
      videoCommission: 15,
      educationCommission: 15,
      totalCollected: 0,
    });

    // Delete providers except Shahal and Acharya Amit
    const originalProviderIds = [
      new mongoose.Types.ObjectId('6a32441ad4374ae4b32c684a'), // Shahal
      new mongoose.Types.ObjectId('6a328843c8270860ab28ddd6'), // Acharya Amit
    ];
    await Provider.deleteMany({ _id: { $nin: originalProviderIds } });

    // Restore original fields on Shahal and Acharya Amit
    await Provider.findByIdAndUpdate('6a32441ad4374ae4b32c684a', {
      verificationStatus: 'verified',
      rating: 0,
      totalReviews: 0,
      totalSessions: 0,
      totalEarned: 0,
      walletBalance: 0,
    });

    await Provider.findByIdAndUpdate('6a328843c8270860ab28ddd6', {
      verificationStatus: 'pending',
      rating: 0,
      totalReviews: 0,
      totalSessions: 0,
      totalEarned: 0,
      walletBalance: 0,
    });

    console.log('Database successfully cleared to contain only real data!');
    process.exit(0);
  } catch (error) {
    console.error('Clear error:', error);
    process.exit(1);
  }
}

clear();
