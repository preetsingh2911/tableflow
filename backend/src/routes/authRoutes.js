/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');
const { registerRules, loginRules, forgotPasswordRules, resetPasswordRules, validate } = require('../utils/validators');
const authController = require('../controllers/authController');

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
