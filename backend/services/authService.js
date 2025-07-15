const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');
const { ERROR_MESSAGES } = require('../utils/constants');

class AuthService {
  /**
   * Registers a new user
   */
  async registerUser({ username, email, password }) {
    try {
      logger.info('Registering new user', { username, email });

      const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
      });

      if (existingUser) {
        throw new Error(ERROR_MESSAGES.USER_EXISTS || 'Username or email already exists');
      }

      const saltRounds = config.auth?.bcryptSaltRounds || 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const user = await User.create({ username, email, password_hash });

      logger.info('User registered successfully', { userId: user.id });

      return {
        id: user.id,
        username: user.username,
        email: user.email
      };
    } catch (error) {
      logger.error('Registration failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Logs in a user
   */
  async loginUser({ username, email, password }) {
    try {
      logger.info('User login attempt', { username, email });

      const searchConditions = [];
      if (username) searchConditions.push({ username });
      if (email) searchConditions.push({ email });

      const user = await User.findOne({ where: { [Op.or]: searchConditions } });

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND || 'User not found');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        throw new Error(ERROR_MESSAGES.INVALID_PASSWORD || 'Invalid password');
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        config.auth?.jwtSecret || 'supersecretkey',
        { expiresIn: config.auth?.jwtExpiresIn || '1h' }
      );

      logger.info('Login successful', { userId: user.id });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Login failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Logs out a user (placeholder)
   */
  async logoutUser(_token) {
    try {
      logger.info('Logout called');
      // Token invalidation logic would go here (e.g., blacklist)
      return { message: 'Logout successful' };
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Requests password reset (placeholder)
   */
  async requestPasswordReset(email) {
    try {
      logger.info('Password reset request received', { email });

      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error(ERROR_MESSAGES.EMAIL_NOT_FOUND || 'Email not found');
      }

      // TODO: Generate reset token, save it to DB, and send email
      logger.info('Password reset logic not implemented yet');

      return { message: 'Password reset requested' };
    } catch (error) {
      logger.error('Password reset request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Confirms password reset (placeholder)
   */
  async confirmPasswordReset(resetToken, newPassword) {
    try {
      logger.info('Confirming password reset', { resetToken });

      // TODO: Lookup reset token, validate expiry, reset password
      // Example flow:
      // 1. Find token in DB
      // 2. Validate expiration
      // 3. Hash new password
      // 4. Update user
      // 5. Delete reset token

      return { message: 'Password reset confirmed' };
    } catch (error) {
      logger.error('Password reset confirmation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Gets the current user's profile
   */
  async getProfile(user) {
    try {
      logger.info('Fetching user profile', { userId: user.id });

      const dbUser = await User.findByPk(user.id);

      if (!dbUser) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND || 'User not found');
      }

      return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email
      };
    } catch (error) {
      logger.error('Fetching profile failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();
