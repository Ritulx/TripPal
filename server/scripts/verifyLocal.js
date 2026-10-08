// Run with: node scripts/verifyLocal.js someuser@email.com
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  const [, , email] = process.argv;
  if (!email) {
    console.error('Usage: node scripts/verifyLocal.js <email>');
    process.exit(1);
  }

  await connectDB();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`No user found with email ${email}`);
      return;
    }
    if (user.role !== 'local') {
      console.error(`User ${email} has role "${user.role}", not "local". Verification only applies to Local accounts.`);
      return;
    }
    user.isVerifiedLocal = true;
    await user.save();
    console.log(`✅ ${email} is now a verified Local.`);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();