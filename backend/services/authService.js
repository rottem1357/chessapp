// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  /**
   * Register a new user
   */
  async registerUser({ username, email, password, display_name, country }) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { 
          [Op.or]: [
            { username: username.toLowerCase() }, 
            { email: email.toLowerCase() }
          ] 
        },
        transaction
      });

      if (existingUser) {
        if (existingUser.username === username.toLowerCase()) {
          throw new Error('Username already exists');
        }
        if (existingUser.email === email.toLowerCase()) {
          throw new Error('Email already exists');
        }
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const user = await db.User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash,
        display_name: display_name || username,
        country: country || null
      }, { transaction });

      // Create default preferences
      await db.UserPreferences.create({
        user_id: user.id
      }, { transaction });

      await transaction.commit();
      
      logger.info('User registered successfully', { userId: user.id, username });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        country: user.country
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Registration failed', { error: error.message, username, email });
      throw error;
    }
  }

  /**
   * Login user
   */
  async loginUser({ username, password }) {
    try {
      // Find user by username or email
      const user = await db.User.findOne({
        where: {
          [Op.or]: [
            { username: username.toLowerCase() },
            { email: username.toLowerCase() }
          ]
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          is_admin: user.is_premium // Using premium as admin flag for now
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Update last login and last seen
      await db.User.update(
        { 
          last_login: new Date(),
          last_seen: new Date()
        },
        { where: { id: user.id } }
      );

      logger.info('User logged in successfully', { userId: user.id, username: user.username });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          rating_rapid: user.rating_rapid,
          rating_blitz: user.rating_blitz,
          rating_bullet: user.rating_bullet,
          is_verified: user.is_verified,
          is_premium: user.is_premium
        }
      };
    } catch (error) {
      logger.error('Login failed', { error: error.message, username });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      const user = await db.User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: db.UserPreferences,
          as: 'preferences'
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await db.User.findOne({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (!user) {
        // Don't reveal if email exists for security
        return { message: 'If email exists, reset instructions have been sent' };
      }

      // Delete any existing reset tokens for this user
      await db.ResetToken.destroy({
        where: { 
          user_id: user.id, 
          token_type: 'password_reset' 
        }
      });

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.ResetToken.create({
        user_id: user.id,
        token: resetToken,
        token_type: 'password_reset',
        expires_at: expiresAt
      });

      // TODO: Send email with reset token
      logger.info('Password reset requested', { userId: user.id, email });
      
      return { 
        message: 'If email exists, reset instructions have been sent',
        // In development, return token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      };
    } catch (error) {
      logger.error('Password reset request failed', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(resetToken, newPassword) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Find valid reset token
      const token = await db.ResetToken.findOne({
        where: {
          token: resetToken,
          token_type: 'password_reset',
          expires_at: { [Op.gt]: new Date() },
          used_at: null
        },
        transaction
      });

      if (!token) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const password_hash = await bcrypt.hash(newPassword, 12);

      // Update user password
      await db.User.update(
        { password_hash },
        { where: { id: token.user_id }, transaction }
      );

      // Mark token as used
      await db.ResetToken.update(
        { used_at: new Date() },
        { where: { id: token.id }, transaction }
      );

      await transaction.commit();
      
      logger.info('Password reset completed', { userId: token.user_id });
      
      return { message: 'Password reset successful' };
    } catch (error) {
      await transaction.rollback();
      logger.error('Password reset confirmation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Logout user (for token blacklisting in the future)
   */
  async logoutUser(token) {
    try {
      // TODO: Implement token blacklisting if needed
      logger.info('User logged out');
      return { message: 'Logout successful' };
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();