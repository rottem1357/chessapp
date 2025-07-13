/**
 * Authentication Routes
 * Routes for user authentication
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
// Placeholder validation middleware (to be implemented)
const { validateRegister, validateLogin, validatePasswordResetRequest, validatePasswordResetConfirm, validateAuthToken } = require('../middleware/validation');
const {
  register,
  login,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  getProfile
} = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Register new user
router.post('/register', 
  validateRegister,
  asyncHandler(register)
);

// Login user
router.post('/login', 
  validateLogin,
  asyncHandler(login)
);

// Logout user
router.post('/logout', 
  validateAuthToken,
  asyncHandler(logout)
);

// Request password reset
router.post('/password-reset/request', 
  validatePasswordResetRequest,
  asyncHandler(requestPasswordReset)
);

// Confirm password reset
router.post('/password-reset/confirm', 
  validatePasswordResetConfirm,
  asyncHandler(confirmPasswordReset)
);

// Get current user profile (protected)
router.get('/me', 
  verifyToken,
  asyncHandler(getProfile)
);

module.exports = router;
