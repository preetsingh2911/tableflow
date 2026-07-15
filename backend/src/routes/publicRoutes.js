/**
 * Public Routes — Customer-facing endpoints (no auth required)
 */
const express = require('express');
const router = express.Router();
const { bookingLimiter } = require('../middleware/rateLimiter');
const { createBookingRules, validate } = require('../utils/validators');
const publicController = require('../controllers/publicController');

router.get('/:slug', publicController.getBusinessInfo);
router.get('/:slug/outlets/:outletId/availability', publicController.getAvailability);
router.get('/:slug/blocked-dates/:outletId', publicController.getBlockedDates);
router.post('/:slug/book', bookingLimiter, createBookingRules, validate, publicController.createBooking);
router.post('/:slug/waitlist', bookingLimiter, publicController.joinWaitlist);
router.get('/booking/:confirmationCode', publicController.getBookingStatus);
router.post('/booking/:confirmationCode/cancel', publicController.cancelBooking);

module.exports = router;
