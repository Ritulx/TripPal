const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser/useUnifiedTopology,
      // but we keep serverSelectionTimeoutMS to fail fast on bad connections.
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    console.log(`[MongoDB] Database name: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error after initial connect: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect is handled by the driver.');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    // Exit process with failure — there is no point running the API without a DB.
    process.exit(1);
  }
};

module.exports = connectDB;