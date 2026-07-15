/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');

// General API rate limit — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests, please try again later.',
  },
});

// Strict rate limit for auth endpoints — 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
});

// Booking rate limit — 10 requests per 15 minutes per IP
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many booking attempts, please try again later.',
  },
});

module.exports = { apiLimiter, authLimiter, bookingLimiter };
