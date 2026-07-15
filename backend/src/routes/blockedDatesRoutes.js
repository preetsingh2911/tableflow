/**
 * Blocked Dates Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const blockedDatesController = require('../controllers/blockedDatesController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/', blockedDatesController.listBlockedDates);
router.post('/', blockedDatesController.blockDates);
router.delete('/:id', blockedDatesController.unblockDate);

module.exports = router;
