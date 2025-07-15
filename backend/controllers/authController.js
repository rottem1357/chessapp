/**
 * Authentication Controller
 * Handles register, login, logout, password reset, and profile endpoints
 */

const authService = require('../services/authService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    logger.info('Registering user', { body: req.body });

    const result = await authService.registerUser(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(formatSuccessResponse(result, 'User registered'));
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(formatErrorResponse(error.message));
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    logger.info('User login attempt', { body: req.body });

    const result = await authService.loginUser(req.body);

    res
      .status(HTTP_STATUS.OK)
      .json(formatSuccessResponse(result, 'Login successful'));
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(formatErrorResponse(error.message));
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  try {
    logger.info('User logout', { token: req.body.token });

    const result = await authService.logoutUser(req.body.token);

    res
      .status(HTTP_STATUS.OK)
      .json(formatSuccessResponse(result, 'Logout successful'));
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(formatErrorResponse(error.message));
  }
}

/**
 * Request password reset
 */
async function requestPasswordReset(req, res) {
  try {
    logger.info('Password reset requested', { email: req.body.email });

    const result = await authService.requestPasswordReset(req.body.email);

    res
      .status(HTTP_STATUS.OK)
      .json(formatSuccessResponse(result, 'Password reset requested'));
  } catch (error) {
    logger.error('Password reset request failed', { error: error.message });
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(formatErrorResponse(error.message));
  }
}

/**
 * Confirm password reset
 */
async function confirmPasswordReset(req, res) {
  try {
    logger.info('Password reset confirmation', { token: req.body.reset_token });

    const result = await authService.confirmPasswordReset(
      req.body.reset_token,
      req.body.new_password
    );

    res
      .status(HTTP_STATUS.OK)
      .json(formatSuccessResponse(result, 'Password reset confirmed'));
  } catch (error) {
    logger.error('Password reset confirmation failed', { error: error.message });
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(formatErrorResponse(error.message));
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    logger.info('Fetching user profile', { userId: req.user?.id });

    const result = await authService.getProfile(req.user);

    res
      .status(HTTP_STATUS.OK)
      .json(formatSuccessResponse(result, 'Profile fetched'));
  } catch (error) {
    logger.error('Fetching profile failed', { error: error.message });
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(formatErrorResponse(error.message));
  }
}

module.exports = {
  register,
  login,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  getProfile,
};
