/**
 * Express-validator validation chains for reuse across routes
 */
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Middleware to check validation results and throw AppError if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new AppError('Validation failed', 400, messages);
  }
  next();
};

// --- Auth Validators ---

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2–100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number required'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2–100 characters'),
  body('slug')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be 3–50 characters, lowercase alphanumeric and hyphens only'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// --- Business Validators ---

const updateBusinessRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2–100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description max 500 characters'),
  body('brandColor')
    .optional()
    .matches(/^#([0-9A-Fa-f]{6})$/)
    .withMessage('Brand color must be a valid hex (e.g., #FF5733)'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
];

// --- Outlet Validators ---

const outletRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Outlet name must be 2–100 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Address must be 5–300 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Valid 6-digit pincode required'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number required'),
  body('seatingCapacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Seating capacity must be at least 1'),
  body('openingTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Opening time must be HH:MM format'),
  body('closingTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Closing time must be HH:MM format'),
];

// --- Time Slot Validators ---

const slotRules = [
  body('outletId').isInt({ min: 1 }).withMessage('Valid outlet ID is required'),
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be 0 (Sunday) to 6 (Saturday)'),
  body('startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be HH:MM format'),
  body('endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be HH:MM format'),
  body('maxTables')
    .isInt({ min: 1 })
    .withMessage('Max tables must be at least 1'),
  body('maxGuestsPerTable')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max guests per table must be at least 1'),
];

// --- Table Validators ---

const tableRules = [
  body('outletId').isInt({ min: 1 }).withMessage('Valid outlet ID is required'),
  body('tableNumber')
    .trim()
    .notEmpty()
    .withMessage('Table number/name is required'),
  body('capacity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Table capacity must be 1–50'),
  body('location')
    .optional()
    .isIn(['indoor', 'outdoor', 'terrace', 'private'])
    .withMessage('Location must be indoor, outdoor, terrace, or private'),
];

// --- Booking Validators ---

const createBookingRules = [
  body('outletId').isInt({ min: 1 }).withMessage('Valid outlet ID is required'),
  body('timeSlotId').isInt({ min: 1 }).withMessage('Valid time slot ID is required'),
  body('bookingDate')
    .isISO8601()
    .withMessage('Valid booking date required (YYYY-MM-DD)'),
  body('guestCount')
    .isInt({ min: 1, max: 20 })
    .withMessage('Guest count must be 1–20'),
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be 2–100 characters'),
  body('customerPhone')
    .trim()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number required'),
  body('customerEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests max 500 characters'),
];

// --- Common Param Validators ---

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateBusinessRules,
  outletRules,
  slotRules,
  tableRules,
  createBookingRules,
  idParam,
};
