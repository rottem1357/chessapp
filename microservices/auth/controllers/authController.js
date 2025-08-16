// microservices/auth/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');
const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    const { username, email, password, display_name, country } = req.body;

    logger.info('Registration attempt', { 
      username, 
      email,
      ip: req.ip,
      traceId: req.traceId
    });

    // Check if user already exists
    const existingUser = await userService.findByUsernameOrEmail(username, email);
    if (existingUser) {
      logger.warn('Registration failed - user exists', { 
        username, 
        email,
        existingUsername: existingUser.username,
        traceId: req.traceId
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatResponse(false, null, 'Username or email already exists', 'USER_EXISTS')
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user
    const userData = {
      id: uuidv4(),
      username,
      email,
      password_hash: passwordHash,
      display_name: display_name || username,
      country: country || null
    };

    const user = await userService.createUser(userData);

    logger.info('User registered successfully', { 
      userId: user.id, 
      username: user.username,
      traceId: req.traceId
    });

    // Remove sensitive data from response
    const { password_hash, ...userResponse } = user;

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, userResponse, 'User registered successfully', null)
    );
  } catch (error) {
    logger.error('Registration failed', { 
      error: error.message,
      traceId: req.traceId
    });

    const statusCode = error.constraint ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'REGISTRATION_FAILED')
    );
  }
}

/**
 * Authenticate user and return JWT token
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    logger.info('Login attempt', { 
      username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      traceId: req.traceId
    });

    // Find user by username or email
    const user = await userService.findByUsernameOrEmail(username, username);
    if (!user) {
      logger.warn('Login failed - user not found', { 
        username,
        ip: req.ip,
        traceId: req.traceId
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      logger.warn('Login failed - invalid password', { 
        userId: user.id,
        username: user.username,
        ip: req.ip,
        traceId: req.traceId
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin || false
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    });

    // Generate refresh token
    const refreshToken = await tokenService.createRefreshToken(user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update last login
    await userService.updateLastLogin(user.id);

    logger.info('Login successful', { 
      userId: user.id,
      username: user.username,
      traceId: req.traceId
    });

    // Remove sensitive data from response
    const { password_hash, ...userResponse } = user;

    res.json(
      formatResponse(true, {
        token,
        refreshToken,
        user: userResponse
      }, 'Login successful', null)
    );
  } catch (error) {
    logger.error('Login failed', { 
      error: error.message,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'LOGIN_FAILED')
    );
  }
}

/**
 * Logout user (invalidate refresh token)
 */
async function logout(req, res) {
  try {
    const userId = req.user.id;
    const refreshToken = req.body.refreshToken;

    logger.info('Logout attempt', { 
      userId,
      traceId: req.traceId
    });

    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    logger.info('Logout successful', { 
      userId,
      traceId: req.traceId
    });

    res.json(
      formatResponse(true, null, 'Logout successful', null)
    );
  } catch (error) {
    logger.error('Logout failed', { 
      error: error.message,
      userId: req.user?.id,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'LOGOUT_FAILED')
    );
  }
}

/**
 * Get user profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await userService.findById(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatResponse(false, null, 'User not found', 'USER_NOT_FOUND')
      );
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = user;

    res.json(
      formatResponse(true, userProfile, 'Profile retrieved successfully', null)
    );
  } catch (error) {
    logger.error('Get profile failed', { 
      error: error.message,
      userId: req.user?.id,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
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
      ip: req.ip,
      traceId: req.traceId
    });

    const user = await userService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json(
        formatResponse(true, null, 'If the email exists, a reset link has been sent', null)
      );
    }

    // Create password reset token
    const resetToken = await tokenService.createPasswordResetToken(user.id);

    // TODO: Send email with reset token
    logger.info('Password reset token created', { 
      userId: user.id,
      tokenId: resetToken.id,
      traceId: req.traceId
    });

    res.json(
      formatResponse(true, null, 'If the email exists, a reset link has been sent', null)
    );
  } catch (error) {
    logger.error('Password reset request failed', { 
      error: error.message,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PASSWORD_RESET_REQUEST_FAILED')
    );
  }
}

/**
 * Confirm password reset
 */
async function confirmPasswordReset(req, res) {
  try {
    const { token, new_password } = req.body;

    logger.info('Password reset confirmation attempt', {
      traceId: req.traceId
    });

    // Verify reset token
    const resetToken = await tokenService.verifyPasswordResetToken(token);
    if (!resetToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatResponse(false, null, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN')
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, config.bcrypt.saltRounds);

    // Update user password
    await userService.updatePassword(resetToken.user_id, passwordHash);

    // Mark token as used
    await tokenService.markPasswordResetTokenUsed(resetToken.id);

    // Revoke all refresh tokens for this user
    await tokenService.revokeAllRefreshTokensForUser(resetToken.user_id);

    logger.info('Password reset successful', { 
      userId: resetToken.user_id,
      traceId: req.traceId
    });

    res.json(
      formatResponse(true, null, 'Password reset successful', null)
    );
  } catch (error) {
    logger.error('Password reset confirmation failed', { 
      error: error.message,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PASSWORD_RESET_FAILED')
    );
  }
}

/**
 * Refresh JWT token
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatResponse(false, null, 'Refresh token is required', 'REFRESH_TOKEN_REQUIRED')
      );
    }

    // Verify refresh token
    const tokenData = await tokenService.verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN')
      );
    }

    // Get user
    const user = await userService.findById(tokenData.user_id);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'User not found', 'USER_NOT_FOUND')
      );
    }

    // Generate new JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin || false
    };

    const newToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    });

    // Update refresh token last used time
    await tokenService.updateRefreshTokenLastUsed(tokenData.id);

    logger.info('Token refreshed successfully', { 
      userId: user.id,
      traceId: req.traceId
    });

    res.json(
      formatResponse(true, {
        token: newToken,
        refreshToken // Return the same refresh token
      }, 'Token refreshed successfully', null)
    );
  } catch (error) {
    logger.error('Token refresh failed', { 
      error: error.message,
      traceId: req.traceId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'TOKEN_REFRESH_FAILED')
    );
  }
}

/**
 * Verify email (placeholder)
 */
async function verifyEmail(req, res) {
  try {
    const { verification_token } = req.body;

    logger.info('Email verification attempt', { 
      traceId: req.traceId
    });

    // TODO: Implement email verification logic
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Email verification not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Email verification failed', { 
      error: error.message,
      traceId: req.traceId
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

    logger.info('Password change attempt', { 
      userId,
      traceId: req.traceId
    });

    // Get current user
    const user = await userService.findById(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatResponse(false, null, 'User not found', 'USER_NOT_FOUND')
      );
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatResponse(false, null, 'Current password is incorrect', 'INVALID_CURRENT_PASSWORD')
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, config.bcrypt.saltRounds);

    // Update password
    await userService.updatePassword(userId, newPasswordHash);

    // Revoke all refresh tokens (force re-login)
    await tokenService.revokeAllRefreshTokensForUser(userId);

    logger.info('Password changed successfully', { 
      userId,
      traceId: req.traceId
    });

    res.json(
      formatResponse(true, null, 'Password changed successfully', null)
    );
  } catch (error) {
    logger.error('Password change failed', { 
      error: error.message,
      userId: req.user?.id,
      traceId: req.traceId
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