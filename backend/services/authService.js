/**
 * Auth Service
 * Handles user authentication, registration, password reset, and profile
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const { ERROR_MESSAGES } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config');

class AuthService {
  async registerUser({ username, email, password }) {
    try {
      logger.info('Registering user', { username, email });
      if (!username || !email || !password) {
        throw new Error(ERROR_MESSAGES.MISSING_FIELDS || 'All fields are required');
      }
      const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
      if (existing) {
        throw new Error(ERROR_MESSAGES.USER_EXISTS || 'Username or email already exists');
      }
      const password_hash = await bcrypt.hash(password, config.auth?.bcryptSaltRounds || 10);
      const user = await User.create({ username, email, password_hash });
      logger.info('User registered', { id: user.id, username: user.username });
      return formatSuccessResponse({ id: user.id, username: user.username, email: user.email }, 'User registered');
    } catch (error) {
      logger.error('Registration failed', { error: error.message });
      throw error;
    }
  }

  async loginUser({ username, email, password }) {
    try {
      logger.info('User login attempt', { username, email });
      // Build dynamic OR query only for provided fields
      const orConditions = [];
      if (username) orConditions.push({ username });
      if (email) orConditions.push({ email });
      if (orConditions.length === 0) {
        throw new Error(ERROR_MESSAGES.MISSING_FIELDS || 'Username or email required');
      }
      const user = await User.findOne({ where: { [Op.or]: orConditions } });
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND || 'User not found');
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        throw new Error(ERROR_MESSAGES.INVALID_PASSWORD || 'Invalid password');
      }
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        config.auth?.jwtSecret || 'supersecretkey',
        { expiresIn: config.auth?.jwtExpiresIn || '1h' }
      );
      logger.info('User logged in', { id: user.id, username: user.username });
      return formatSuccessResponse({ token, user: { id: user.id, username: user.username, email: user.email } }, 'Login successful');
    } catch (error) {
      logger.error('Login failed', { error: error.message });
      throw error;
    }
  }

  async logoutUser(token) {
    try {
      logger.info('User logout', { token });
      // TODO: Invalidate session/token (if using JWT, client just discards token)
      return formatSuccessResponse(null, 'Logout successful');
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      logger.info('Password reset requested', { email });
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error(ERROR_MESSAGES.EMAIL_NOT_FOUND || 'Email not found');
      }
      // TODO: Save token and send email
      return formatSuccessResponse(null, 'Password reset requested');
    } catch (error) {
      logger.error('Password reset request failed', { error: error.message });
      throw error;
    }
  }

  async confirmPasswordReset(reset_token, new_password) {
    try {
      logger.info('Password reset confirmation', { reset_token });
      // TODO: Validate token, update password
      return formatSuccessResponse(null, 'Password reset confirmed');
    } catch (error) {
      logger.error('Password reset confirmation failed', { error: error.message });
      throw error;
    }
  }

  async getProfile(user) {
    try {
      logger.info('Fetching user profile', { userId: user.id });
      const dbUser = await User.findByPk(user.id);
      if (!dbUser) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND || 'User not found');
      }
      return formatSuccessResponse({ id: dbUser.id, username: dbUser.username, email: dbUser.email }, 'Profile fetched');
    } catch (error) {
      logger.error('Get profile failed', { error: error.message });
      throw error;
    }
  }
}

const authService = new AuthService();
module.exports = authService;
