/**
 * TableFlow Backend — Express Server Entry Point
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { globalErrorHandler, AppError } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// --- Route Imports ---
const { startReminderCrons } = require('./src/services/reminderCron');
const authRoutes = require('./src/routes/authRoutes');
const platformAdminRoutes = require('./src/routes/platformAdminRoutes');
const businessRoutes = require('./src/routes/businessRoutes');
const outletRoutes = require('./src/routes/outletRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const blockedDatesRoutes = require('./src/routes/blockedDatesRoutes');

const app = express();

// --- Global Middleware ---
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const baseDomain = process.env.BASE_DOMAIN || 'tableflow.in';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Allow frontend URL, any subdomain of base domain, and localhost in dev
    const allowedPatterns = [
      frontendUrl,
      new RegExp(`^https?://([a-z0-9-]+\\.)?${baseDomain.replace('.', '\\.')}$`),
    ];

    if (process.env.NODE_ENV === 'development') {
      allowedPatterns.push(/^http:\/\/localhost:\d+$/);
    }

    const isAllowed = allowedPatterns.some(pattern => {
      if (typeof pattern === 'string') return origin === pattern;
      return pattern.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
app.use('/api/', apiLimiter);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TableFlow API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/platform-admin', platformAdminRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/blocked-dates', blockedDatesRoutes);

// --- 404 Handler ---
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// --- Global Error Handler ---
app.use(globalErrorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 TableFlow API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  
  // Start automated cron jobs
  startReminderCrons();
});

module.exports = app;
