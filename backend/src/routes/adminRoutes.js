/**
 * Admin Routes — Platform admin only
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { idParam, validate } = require('../utils/validators');
const adminController = require('../controllers/adminController');

// All admin routes require platform_admin role
router.use(authenticate, authorize('platform_admin'));

router.get('/stats', adminController.getPlatformStats);
router.get('/businesses', adminController.listBusinesses);
router.get('/businesses/:id', idParam, validate, adminController.getBusinessDetail);
router.put('/businesses/:id/status', idParam, validate, adminController.updateBusinessStatus);
router.post('/businesses/:id/impersonate', idParam, validate, adminController.impersonateBusiness);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
