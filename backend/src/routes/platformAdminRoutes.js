/**
 * Platform Admin Routes — Master control panel endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate, requirePlatformAdmin } = require('../middleware/authMiddleware');
const platformAdminAuthController = require('../controllers/platformAdminAuthController');
const platformAdminController = require('../controllers/platformAdminController');

// Auth routes (No token required for login)
router.post('/auth/login', platformAdminAuthController.login);
router.post('/auth/refresh', platformAdminAuthController.refresh);
router.post('/auth/logout', platformAdminAuthController.logout);

// Protected routes
router.use(authenticate, requirePlatformAdmin);

router.get('/auth/me', platformAdminAuthController.getMe);

// Dashboard & Stats
router.get('/dashboard', platformAdminController.getDashboardStats);

// Businesses
router.get('/businesses', platformAdminController.listBusinesses);
router.get('/businesses/:id', platformAdminController.getBusinessDetail);
router.put('/businesses/:id/status', platformAdminController.updateBusinessStatus);
router.post('/businesses/:id/impersonate', platformAdminController.impersonateBusiness);

// Platform Settings
router.get('/settings', platformAdminController.getSettings);
router.put('/settings', platformAdminController.updateSettings);

module.exports = router;
