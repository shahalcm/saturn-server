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

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected!');

    // 1. Clear existing collections
    console.log('Cleaning existing data...');
    await User.deleteMany({});
    await Provider.deleteMany({});
    await Session.deleteMany({});
    await Transaction.deleteMany({});
    await Commission.deleteMany({});
    await Prayer.deleteMany({});
    await EducationCourse.deleteMany({});
    await Community.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    // 2. Seed Commission config
    console.log('Seeding commission configurations...');
    const commission = await Commission.create({
      chatCommission: 5,
      callCommission: 5,
      videoCommission: 5,
      educationCommission: 5,
      courseCommission: 5,
      totalCollected: 2350,
    });

    // 3. Seed Providers
    console.log('Seeding service providers...');
    const providers = await Provider.create([
      {
        _id: new mongoose.Types.ObjectId('6a32441ad4374ae4b32c684a'), // Shahal
        name: 'Shahal',
        phone: '9744367826',
        email: 'shahal@saturn.com',
        providerType: 'teacher',
        religion: 'muslim',
        gender: 'male',
        languages: ['English', 'Malayalam'],
        experience: 5,
        qualification: 'MA in Islamic Studies',
        about: 'Specialist Quran recitation and Islamic history teacher.',
        pricePerMin: 20,
        isOnline: true,
        verificationStatus: 'verified',
        rating: 4.9,
        totalReviews: 2,
        totalSessions: 12,
        totalEarned: 2400,
        walletBalance: 2400,
        isPhoneVerified: true,
      },
      {
        _id: new mongoose.Types.ObjectId('6a328843c8270860ab28ddd6'), // Acharya Amit
        name: 'Acharya Amit',
        phone: '+918888888888',
        email: 'amit@saturn.com',
        providerType: 'astrologer',
        religion: 'hindu',
        gender: 'male',
        languages: ['Hindi', 'English'],
        experience: 12,
        qualification: 'Jyotish Acharya',
        about: 'Expert in Vedic Astrology, Kundali matching, and gemstones advice.',
        pricePerMin: 30,
        isOnline: true,
        verificationStatus: 'pending',
        rating: 4.7,
        totalReviews: 2,
        totalSessions: 8,
        totalEarned: 1680,
        walletBalance: 1680,
        isPhoneVerified: true,
      },
      {
        _id: new mongoose.Types.ObjectId('6a328843c8270860ab28ddd7'), // Dr. Pooja Sharma
        name: 'Dr. Pooja Sharma',
        phone: '+917777777777',
        email: 'pooja@saturn.com',
        providerType: 'doctor',
        religion: 'hindu',
        gender: 'female',
        languages: ['Hindi', 'English', 'Punjabi'],
        experience: 8,
        qualification: 'BAMS (Ayurveda)',
        about: 'Consultant in traditional Ayurvedic medicine, pulse diagnosis, and lifestyle health coaching.',
        pricePerMin: 40,
        isOnline: false,
        verificationStatus: 'verified',
        rating: 4.8,
        totalReviews: 1,
        totalSessions: 5,
        totalEarned: 2000,
        walletBalance: 2000,
        isPhoneVerified: true,
      },
      {
        _id: new mongoose.Types.ObjectId('6a328843c8270860ab28ddd8'), // Father Thomas
        name: 'Father Thomas',
        phone: '+916666666666',
        email: 'thomas@saturn.com',
        providerType: 'teacher',
        religion: 'christian',
        gender: 'male',
        languages: ['English', 'Tamil'],
        experience: 15,
        qualification: 'Doctorate in Theology',
        about: 'Guide in Christian ethics, history, and family counseling.',
        pricePerMin: 25,
        isOnline: true,
        verificationStatus: 'verified',
        rating: 4.6,
        totalReviews: 1,
        totalSessions: 6,
        totalEarned: 1200,
        walletBalance: 1200,
        isPhoneVerified: true,
      }
    ]);

    // 4. Seed Seekers (Users)
    console.log('Seeding seekers...');
    const seekers = await User.create([
      {
        name: 'Rahul Kumar',
        phone: '+919999999991',
        email: 'rahul@gmail.com',
        religion: 'hindu',
        gender: 'male',
        languages: ['Hindi', 'English'],
        isPhoneVerified: true,
        walletBalance: 500,
        totalSessions: 5,
        totalSpent: 1250,
      },
      {
        name: 'Aisha Khan',
        phone: '+919999999992',
        email: 'aisha@gmail.com',
        religion: 'muslim',
        gender: 'female',
        languages: ['English', 'Urdu'],
        isPhoneVerified: true,
        walletBalance: 800,
        totalSessions: 8,
        totalSpent: 2100,
      },
      {
        name: 'John Doe',
        phone: '+919999999993',
        email: 'john@gmail.com',
        religion: 'christian',
        gender: 'male',
        languages: ['English'],
        isPhoneVerified: true,
        walletBalance: 1200,
        totalSessions: 4,
        totalSpent: 900,
      },
      {
        name: 'Amit Patel',
        phone: '+919999999994',
        email: 'patel@gmail.com',
        religion: 'hindu',
        gender: 'male',
        languages: ['Gujarati', 'Hindi'],
        isPhoneVerified: true,
        walletBalance: 300,
        totalSessions: 2,
        totalSpent: 450,
      }
    ]);

    // Helper to generate dates relative to today
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    // 5. Seed Sessions
    console.log('Seeding session logs...');
    const sessionLogs = await Session.create([
      {
        seekerId: seekers[0]._id, // Rahul
        providerId: providers[1]._id, // Acharya Amit
        type: 'chat',
        status: 'completed',
        startTime: daysAgo(1),
        endTime: new Date(daysAgo(1).getTime() + 20 * 60000),
        duration: 20,
        pricePerMin: 30,
        totalAmount: 600,
        commissionRate: 15,
        commissionAmount: 90,
        providerEarning: 510,
        paymentStatus: 'paid',
        religion: 'hindu',
        createdAt: daysAgo(1),
      },
      {
        seekerId: seekers[0]._id, // Rahul
        providerId: providers[2]._id, // Dr. Pooja
        type: 'video',
        status: 'completed',
        startTime: daysAgo(2),
        endTime: new Date(daysAgo(2).getTime() + 15 * 60000),
        duration: 15,
        pricePerMin: 40,
        totalAmount: 600,
        commissionRate: 15,
        commissionAmount: 90,
        providerEarning: 510,
        paymentStatus: 'paid',
        religion: 'hindu',
        createdAt: daysAgo(2),
      },
      {
        seekerId: seekers[1]._id, // Aisha
        providerId: providers[0]._id, // Shahal
        type: 'class',
        status: 'completed',
        startTime: daysAgo(3),
        endTime: new Date(daysAgo(3).getTime() + 60 * 60000),
        duration: 60,
        pricePerMin: 20,
        totalAmount: 1200,
        commissionRate: 15,
        commissionAmount: 180,
        providerEarning: 1020,
        paymentStatus: 'paid',
        religion: 'muslim',
        createdAt: daysAgo(3),
      },
      {
        seekerId: seekers[1]._id, // Aisha
        providerId: providers[0]._id, // Shahal
        type: 'chat',
        status: 'completed',
        startTime: daysAgo(4),
        endTime: new Date(daysAgo(4).getTime() + 25 * 60000),
        duration: 25,
        pricePerMin: 20,
        totalAmount: 500,
        commissionRate: 15,
        commissionAmount: 75,
        providerEarning: 425,
        paymentStatus: 'paid',
        religion: 'muslim',
        createdAt: daysAgo(4),
      },
      {
        seekerId: seekers[2]._id, // John
        providerId: providers[3]._id, // Father Thomas
        type: 'call',
        status: 'completed',
        startTime: daysAgo(5),
        endTime: new Date(daysAgo(5).getTime() + 30 * 60000),
        duration: 30,
        pricePerMin: 25,
        totalAmount: 750,
        commissionRate: 15,
        commissionAmount: 112.5,
        providerEarning: 637.5,
        paymentStatus: 'paid',
        religion: 'christian',
        createdAt: daysAgo(5),
      },
      {
        seekerId: seekers[3]._id, // Amit Patel
        providerId: providers[1]._id, // Acharya Amit
        type: 'chat',
        status: 'completed',
        startTime: daysAgo(6),
        endTime: new Date(daysAgo(6).getTime() + 15 * 60000),
        duration: 15,
        pricePerMin: 30,
        totalAmount: 450,
        commissionRate: 15,
        commissionAmount: 67.5,
        providerEarning: 382.5,
        paymentStatus: 'paid',
        religion: 'hindu',
        createdAt: daysAgo(6),
      },
      {
        seekerId: seekers[0]._id, // Rahul
        providerId: providers[1]._id, // Acharya Amit
        type: 'call',
        status: 'cancelled',
        cancellationReason: 'No response from host',
        cancelledBy: 'seeker',
        pricePerMin: 30,
        religion: 'hindu',
        createdAt: daysAgo(0),
      }
    ]);

    // 6. Seed Transactions (Revenue)
    console.log('Seeding transaction logs...');
    await Transaction.create([
      // Topups
      {
        userId: seekers[0]._id,
        type: 'wallet_topup',
        amount: 2000,
        status: 'completed',
        description: 'Wallet top-up via card',
        createdAt: daysAgo(7),
      },
      {
        userId: seekers[1]._id,
        type: 'wallet_topup',
        amount: 3000,
        status: 'completed',
        description: 'Wallet top-up via UPI',
        createdAt: daysAgo(5),
      },
      {
        userId: seekers[2]._id,
        type: 'wallet_topup',
        amount: 1500,
        status: 'completed',
        description: 'Wallet top-up via Netbanking',
        createdAt: daysAgo(6),
      },
      // Session Payments
      {
        userId: seekers[0]._id,
        providerId: providers[1]._id,
        sessionId: sessionLogs[0]._id,
        type: 'session_payment',
        amount: 600,
        status: 'completed',
        commissionAmount: 90,
        commissionRate: 15,
        providerEarning: 510,
        description: 'Consultation session payment',
        createdAt: daysAgo(1),
      },
      {
        userId: seekers[0]._id,
        providerId: providers[2]._id,
        sessionId: sessionLogs[1]._id,
        type: 'session_payment',
        amount: 600,
        status: 'completed',
        commissionAmount: 90,
        commissionRate: 15,
        providerEarning: 510,
        description: 'Consultation session payment',
        createdAt: daysAgo(2),
      },
      {
        userId: seekers[1]._id,
        providerId: providers[0]._id,
        sessionId: sessionLogs[2]._id,
        type: 'session_payment',
        amount: 1200,
        status: 'completed',
        commissionAmount: 180,
        commissionRate: 15,
        providerEarning: 1020,
        description: 'Consultation session payment',
        createdAt: daysAgo(3),
      },
      {
        userId: seekers[1]._id,
        providerId: providers[0]._id,
        sessionId: sessionLogs[3]._id,
        type: 'session_payment',
        amount: 500,
        status: 'completed',
        commissionAmount: 75,
        commissionRate: 15,
        providerEarning: 425,
        description: 'Consultation session payment',
        createdAt: daysAgo(4),
      },
      {
        userId: seekers[2]._id,
        providerId: providers[3]._id,
        sessionId: sessionLogs[4]._id,
        type: 'session_payment',
        amount: 750,
        status: 'completed',
        commissionAmount: 112.5,
        commissionRate: 15,
        providerEarning: 637.5,
        description: 'Consultation session payment',
        createdAt: daysAgo(5),
      },
      {
        userId: seekers[3]._id,
        providerId: providers[1]._id,
        sessionId: sessionLogs[5]._id,
        type: 'session_payment',
        amount: 450,
        status: 'completed',
        commissionAmount: 67.5,
        commissionRate: 15,
        providerEarning: 382.5,
        description: 'Consultation session payment',
        createdAt: daysAgo(6),
      }
    ]);

    // 7. Seed Prayers
    console.log('Seeding prayers...');
    await Prayer.create([
      {
        title: 'Weekly Ganesh Havan & Mantras recitation',
        religion: 'hindu',
        host: 'Acharya Amit',
        hostId: providers[1]._id,
        scheduledDate: daysAgo(-2), // 2 days in the future
        scheduledTime: '18:00',
        description: 'Vedic rituals and special mantras for removing obstacles and seeking wisdom.',
        status: 'scheduled',
        viewers: 0,
      },
      {
        title: 'Sufi Spiritual Qawwali & Quranic Blessings',
        religion: 'muslim',
        host: 'Shahal',
        hostId: providers[0]._id,
        scheduledDate: daysAgo(0),
        scheduledTime: '20:00',
        description: 'Live reflection on Sufi spiritualism and melodic Quranic recitations.',
        status: 'live',
        viewers: 45,
        peakViewers: 80,
      },
      {
        title: 'Sunday Morning Mass Devotion',
        religion: 'christian',
        host: 'Father Thomas',
        hostId: providers[3]._id,
        scheduledDate: daysAgo(3),
        scheduledTime: '09:00',
        description: 'Worship service, scripture readings, and prayer sermons.',
        status: 'completed',
        viewers: 0,
        peakViewers: 150,
      }
    ]);

    // 8. Seed Education Courses
    console.log('Seeding study courses...');
    await EducationCourse.create([
      {
        title: 'Vedic Astrology: Master Your Birth Chart',
        instructor: 'Acharya Amit',
        instructorId: providers[1]._id,
        religion: 'hindu',
        level: 'Intermediate',
        price: '₹1499',
        priceAmount: 1499,
        duration: '6 weeks',
        description: 'Learn to read birth charts, analyze houses, and calculate planets alignments.',
        totalStudents: 24,
        rating: 4.8,
        isActive: true,
        meetLink: 'https://meet.google.com/xyz-abc-123',
      },
      {
        title: 'Art of Quran Tajweed Recitation',
        instructor: 'Shahal',
        instructorId: providers[0]._id,
        religion: 'muslim',
        level: 'Beginner',
        price: 'Free',
        priceAmount: 0,
        duration: '4 weeks',
        description: 'Focus on absolute correct pronunciation of letters and melodious chanting rules.',
        totalStudents: 142,
        rating: 4.9,
        isActive: true,
        meetLink: 'https://meet.google.com/qwe-asd-456',
      },
      {
        title: 'Introduction to Christian Theology & Ethics',
        instructor: 'Father Thomas',
        instructorId: providers[3]._id,
        religion: 'christian',
        level: 'Advanced',
        price: '₹1999',
        priceAmount: 1999,
        duration: '8 weeks',
        description: 'Comprehensive study of historical theology, philosophies, and modern ethics.',
        totalStudents: 12,
        rating: 4.6,
        isActive: false,
        meetLink: 'https://meet.google.com/poi-lkj-789',
      }
    ]);

    // 9. Seed Community Posts
    console.log('Seeding community posts...');
    const communityPosts = await Community.create([
      {
        authorId: seekers[0]._id, // Rahul
        authorName: seekers[0].name,
        content: 'Does anyone have gemstone recommendations for calming anxiety? Looking for advice on birth chart houses.',
        religion: 'hindu',
        likes: [seekers[1]._id, seekers[2]._id],
        comments: [
          {
            userId: seekers[3]._id,
            name: seekers[3].name,
            text: 'I suggest consulting Acharya Amit, he gave me excellent gemstone suggestions last week!',
          }
        ],
        isReported: false,
        isHidden: false,
      },
      {
        authorId: seekers[1]._id, // Aisha
        authorName: seekers[1].name,
        content: 'Loved the live Sufi recitation tonight by teacher Shahal! So serene.',
        religion: 'muslim',
        likes: [seekers[0]._id],
        comments: [],
        isReported: false,
        isHidden: false,
      },
      {
        authorId: seekers[2]._id, // John
        authorName: seekers[2].name,
        content: 'Unfriendly language and spam content post here to demonstrate flag moderation.',
        religion: 'christian',
        likes: [],
        comments: [],
        isReported: true,
        reportCount: 3,
        isHidden: false,
      },
      {
        authorId: seekers[3]._id, // Amit Patel
        authorName: seekers[3].name,
        content: 'Spam advertising link click here and claim free lottery money!!!',
        religion: 'hindu',
        likes: [],
        comments: [],
        isReported: true,
        reportCount: 12,
        isHidden: true,
      }
    ]);

    // 10. Seed Reviews
    console.log('Seeding reviews...');
    await Review.create([
      {
        sessionId: sessionLogs[0]._id,
        seekerId: seekers[0]._id,
        providerId: providers[1]._id,
        rating: 5,
        review: 'Excellent astrology reading! Very thorough and precise.',
      },
      {
        sessionId: sessionLogs[2]._id,
        seekerId: seekers[1]._id,
        providerId: providers[0]._id,
        rating: 5,
        review: 'Incredibly smooth class session on Quranic studies. Shahal is patient.',
      },
      {
        sessionId: sessionLogs[4]._id,
        seekerId: seekers[2]._id,
        providerId: providers[3]._id,
        rating: 4.5,
        review: 'Great counseling session, provided helpful perspectives.',
      }
    ]);

    // 11. Seed Notifications Log
    console.log('Seeding push notifications log...');
    await Notification.create([
      {
        title: 'Weekly Ganesh Havan scheduled',
        body: 'Join Acharya Amit live this Thursday at 6 PM for Ganesh Puja and special mantras.',
        targetGroup: 'hindu',
        type: 'prayer_alert',
        sentAt: daysAgo(1),
        delivered: 3,
        opened: 2,
      },
      {
        title: 'Quran recitation starts in 10 minutes',
        body: 'Teacher Shahal is going live for Tajweed lessons. Tune in now.',
        targetGroup: 'muslim',
        type: 'prayer_alert',
        sentAt: daysAgo(3),
        delivered: 1,
        opened: 1,
      },
      {
        title: 'Welcome to Saturn',
        body: 'Thank you for downloading the Saturn app. We are glad to help you on your spiritual path.',
        targetGroup: 'all',
        type: 'general',
        sentAt: daysAgo(6),
        delivered: 4,
        opened: 3,
      }
    ]);

    console.log('MongoDB successfully seeded with genuine data!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
