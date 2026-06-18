const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Provider = require('./src/models/Provider');
const User = require('./src/models/User');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const providers = await Provider.find({});
    console.log('All providers count:', providers.length);
    console.log('Providers detail:', providers.map(p => ({
      id: p._id,
      name: p.name,
      providerType: p.providerType,
      verificationStatus: p.verificationStatus,
      phone: p.phone,
      createdAt: p.createdAt
    })));

    const users = await User.find({});
    console.log('All users count:', users.length);
    console.log('Users detail:', users.map(u => ({
      id: u._id,
      name: u.name,
      role: u.role,
      phone: u.phone,
      email: u.email
    })));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
