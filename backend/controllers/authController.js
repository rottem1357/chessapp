/**
 * Authentication Controller
 * Handles register, login, logout, password reset, and profile endpoints
 */

const { registerUser, loginUser, logoutUser, requestPasswordReset, confirmPasswordReset, getProfile } = require('../services/authService');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    logger.info('Registering user', { body: req.body });
    const userResponse = await registerUser(req.body);
    res.status(HTTP_STATUS.CREATED).json(userResponse);
  } catch (err) {
    logger.error('Registration failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    logger.info('User login attempt', { body: req.body });
    const loginResponse = await loginUser(req.body);
    res.status(HTTP_STATUS.OK).json(loginResponse);
  } catch (err) {
    logger.error('Login failed', { error: err.message });
    res.status(HTTP_STATUS.UNAUTHORIZED).json(formatErrorResponse(err.message));
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  try {
    logger.info('User logout', { token: req.body.token });
    const logoutResponse = await logoutUser(req.body.token);
    res.status(HTTP_STATUS.OK).json(logoutResponse);
  } catch (err) {
    logger.error('Logout failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

/**
 * Request password reset
 */
async function requestPasswordResetHandler(req, res) {
  try {
    logger.info('Password reset requested', { email: req.body.email });
    const resetResponse = await requestPasswordReset(req.body.email);
    res.status(HTTP_STATUS.OK).json(resetResponse);
  } catch (err) {
    logger.error('Password reset request failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

/**
 * Confirm password reset
 */
async function confirmPasswordResetHandler(req, res) {
  try {
    logger.info('Password reset confirmation', { token: req.body.reset_token });
    const confirmResponse = await confirmPasswordReset(req.body.reset_token, req.body.new_password);
    res.status(HTTP_STATUS.OK).json(confirmResponse);
  } catch (err) {
    logger.error('Password reset confirmation failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

/**
 * Get current user profile
 */
async function getProfileHandler(req, res) {
  try {
    logger.info('Fetching user profile', { user: req.user });
    const profileResponse = await getProfile(req.user);
    res.status(HTTP_STATUS.OK).json(profileResponse);
  } catch (err) {
    logger.error('Get profile failed', { error: err.message });
    res.status(HTTP_STATUS.UNAUTHORIZED).json(formatErrorResponse(err.message));
  }
}

module.exports = {
  register,
  login,
  logout,
  requestPasswordReset: requestPasswordResetHandler,
  confirmPasswordReset: confirmPasswordResetHandler,
  getProfile: getProfileHandler
};
