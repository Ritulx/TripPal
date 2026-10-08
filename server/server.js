require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect to MongoDB before starting the server.
connectDB();
const app = express();
app.set('trust proxy', 1);

// --- Security & Utility Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter — addresses SRS Risk R-01 (API cost/quota overrun) at the edge.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per window, matching NFR-02 scalability target
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', globalLimiter);

// --- Health Check Route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TripPal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// --- Route mounting placeholders (populated in later steps) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/places', require('./routes/placeRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/tips', require('./routes/tipRoutes'));
app.use('/api/tips/:tipId/replies', require('./routes/tipReplyRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// --- Error Handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] TripPal API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown on unhandled promise rejections (e.g., bad DB queries not caught elsewhere).
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.message}`);
  server.close(() => process.exit(1));
});