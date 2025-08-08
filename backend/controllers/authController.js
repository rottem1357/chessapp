// controllers/authController.js
const authService = require('../services/authService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    const { username, email, password, display_name, country } = req.body;

    logger.info('User registration attempt', { 
      username, 
      email, 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const result = await authService.registerUser({
      username,
      email, 
      password,
      display_name,
      country
    });

    logger.info('User registered successfully', { 
      userId: result.id, 
      username: result.username 
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, result, 'User registered successfully')
    );
  } catch (error) {
    logger.error('Registration failed', { 
      error: error.message, 
      username: req.body.username,
      email: req.body.email
    });

    const statusCode = error.message.includes('already exists') ? 
      HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'REGISTRATION_FAILED')
    );
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    logger.info('User login attempt', { 
      username, 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const result = await authService.loginUser({ username, password });

    logger.info('User logged in successfully', { 
      userId: result.user.id, 
      username: result.user.username 
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Login successful')
    );
  } catch (error) {
    logger.error('Login failed', { 
      error: error.message, 
      username: req.body.username 
    });

    const statusCode = error.message.includes('Invalid credentials') || 
                      error.message.includes('deactivated') ? 
      HTTP_STATUS.UNAUTHORIZED : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'LOGIN_FAILED')
    );
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    logger.info('User logout attempt', { 
      userId: req.user?.id,
      ip: req.ip
    });

    const result = await authService.logoutUser(token);

    logger.info('User logged out successfully', { 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Logout successful')
    );
  } catch (error) {
    logger.error('Logout failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, error.message, 'LOGOUT_FAILED')
    );
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Profile fetch attempt', { userId });

    const result = await authService.getProfile(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Profile retrieved successfully')
    );
  } catch (error) {
    logger.error('Profile fetch failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PROFILE_FETCH_FAILED')
    );
  }
}

/**
 * Request password reset
 */
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    logger.info('Password reset requested', { 
      email, 
      ip: req.ip 
    });

    const result = await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Password reset instructions sent')
    );
  } catch (error) {
    logger.error('Password reset request failed', { 
      error: error.message, 
      email: req.body.email 
    });

    // Still return success to prevent email enumeration
    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, 
        { message: 'If email exists, reset instructions have been sent' },
        'Password reset instructions sent'
      )
    );
  }
}

/**
 * Confirm password reset
 */
async function confirmPasswordReset(req, res) {
  try {
    const { reset_token, new_password } = req.body;

    logger.info('Password reset confirmation attempt', { 
      reset_token: reset_token.substring(0, 8) + '...',
      ip: req.ip 
    });

    const result = await authService.confirmPasswordReset(reset_token, new_password);

    logger.info('Password reset completed successfully');

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Password reset successful')
    );
  } catch (error) {
    logger.error('Password reset confirmation failed', { 
      error: error.message,
      reset_token: req.body.reset_token?.substring(0, 8) + '...'
    });

    const statusCode = error.message.includes('Invalid or expired') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PASSWORD_RESET_FAILED')
    );
  }
}

/**
 * Refresh JWT token (placeholder for future implementation)
 */
async function refreshToken(req, res) {
  try {
    // TODO: Implement token refresh logic
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Token refresh not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Token refresh failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'TOKEN_REFRESH_FAILED')
    );
  }
}

/**
 * Verify email (placeholder for future implementation)
 */
async function verifyEmail(req, res) {
  try {
    const { verification_token } = req.body;

    // TODO: Implement email verification logic
    logger.info('Email verification attempt', { 
      verification_token: verification_token?.substring(0, 8) + '...',
      ip: req.ip 
    });

    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Email verification not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Email verification failed', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'EMAIL_VERIFICATION_FAILED')
    );
  }
}

/**
 * Change password for authenticated user
 */
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    logger.info('Password change attempt', { userId });

    // TODO: Implement password change logic in authService
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Password change not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Password change failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PASSWORD_CHANGE_FAILED')
    );
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  requestPasswordReset,
  confirmPasswordReset,
  refreshToken,
  verifyEmail,
  changePassword
};
