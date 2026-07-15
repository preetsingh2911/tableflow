/**
 * Business Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const businessController = require('../controllers/businessController');

// All routes require authentication + business owner role
router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership);

router.get('/profile', businessController.getProfile);
router.put('/profile', businessController.updateProfile);
router.put('/onboarding/brand', businessController.updateBrandSetup);

module.exports = router;
