/**
 * Customer Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const customerController = require('../controllers/customerController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/', customerController.listCustomers);

module.exports = router;
