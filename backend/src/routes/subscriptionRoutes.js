/**
 * Subscription Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// Public — list plans (no auth)
router.get('/plans', subscriptionController.listPlans);

// Webhook (no auth — Razorpay calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Protected — requires auth
router.post('/create', authenticate, authorize('business_owner'), subscriptionController.createSubscription);
router.post('/cancel', authenticate, authorize('business_owner'), subscriptionController.cancelSubscription);
router.get('/status', authenticate, authorize('business_owner', 'impersonating'), subscriptionController.getSubscriptionStatus);

module.exports = router;
