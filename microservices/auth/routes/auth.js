// microservices/auth/routes/auth.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRegister, validateLogin, validatePasswordResetRequest, validatePasswordResetConfirm } = require('../middleware/validation');
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, asyncHandler(authController.register));
router.post('/login', validateLogin, asyncHandler(authController.login));
router.post('/password-reset/request', validatePasswordResetRequest, asyncHandler(authController.requestPasswordReset));
router.post('/password-reset/confirm', validatePasswordResetConfirm, asyncHandler(authController.confirmPasswordReset));

// Protected routes
router.post('/logout', verifyToken, asyncHandler(authController.logout));
router.get('/me', verifyToken, asyncHandler(authController.getProfile));

// Additional auth endpoints for service completeness
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/change-password', verifyToken, asyncHandler(authController.changePassword));

module.exports = router;