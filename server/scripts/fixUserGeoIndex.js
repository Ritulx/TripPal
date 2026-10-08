require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  try {
    // Strip any malformed homeLocation objects (type set but coordinates missing).
    const result = await User.updateMany(
      { 'homeLocation.coordinates': { $exists: false } },
      { $unset: { homeLocation: '' } }
    );
    console.log(`Cleaned ${result.modifiedCount} user document(s) with malformed homeLocation.`);

    // Drop and let Mongoose recreate the 2dsphere index with the new sparse option.
    const indexes = await User.collection.indexes();
    const geoIndex = indexes.find((idx) => idx.name.includes('homeLocation'));
    if (geoIndex) {
      await User.collection.dropIndex(geoIndex.name);
      console.log(`Dropped old index: ${geoIndex.name}`);
    }

    await User.syncIndexes();
    console.log('✅ Indexes rebuilt successfully.');
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();