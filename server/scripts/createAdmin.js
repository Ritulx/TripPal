// Run with: node scripts/createAdmin.js "Admin Name" admin@trippal.dev SomeStrongPassword123
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js "<name>" <email> <password>');
    process.exit(1);
  }

  await connectDB();

  try {
    const existing = await User.findOne({ email });
     if (existing) {
      console.log(`User with email ${email} already exists. Promoting to admin and resetting password...`);
      existing.role = 'admin';
      existing.isVerifiedLocal = true;
      existing.password = password; // explicitly reset — pre('save') hook rehashes it since it's modified
      existing.isActive = true; // also reactivate in case it was previously deactivated
      await existing.save();
      console.log('✅ Existing user promoted to admin and password reset to the value you provided.');
    } else {
      const admin = await User.create({
        name,
        email,
        password,
        role: 'admin',
        isVerifiedLocal: true,
        homeLocation: {
          type: 'Point',
          coordinates: [0, 0], // [longitude, latitude] required by MongoDB 2dsphere index
        },
      });
      console.log('✅Admin account created:', admin.email);
    }
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();