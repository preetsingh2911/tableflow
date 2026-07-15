/**
 * Booking Routes — Business owner booking management
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const { bookingRules, idParam, validate } = require('../utils/validators');
const bookingController = require('../controllers/bookingController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/stats', bookingController.getStats);
router.get('/', bookingController.listBookings);
router.post('/manual', bookingController.createManualBooking);
router.get('/:id', idParam, validate, bookingController.getBooking);
router.put('/:id/status', idParam, validate, bookingController.updateBookingStatus);

module.exports = router;
