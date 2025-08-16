// microservices/auth/services/tokenService.js
const { getPool } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');

class TokenService {
  /**
   * Create refresh token
   */
  async createRefreshToken(userId, deviceInfo = {}) {
    const pool = getPool();
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
    
    const query = `
      INSERT INTO refresh_tokens (
        id, user_id, token_hash, device_info, ip_address, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    try {
      const result = await pool.query(query, [
        uuidv4(),
        userId,
        tokenHash,
        JSON.stringify(deviceInfo),
        deviceInfo.ip || null,
        expiresAt
      ]);
      
      return {
        id: result.rows[0].id,
        token: tokenValue
      };
    } catch (error) {
      logger.error('Error creating refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token) {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    
    try {
      const result = await pool.query(query, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error verifying refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Update refresh token last used time
   */
  async updateRefreshTokenLastUsed(tokenId) {
    const pool = getPool();
    const query = 'UPDATE refresh_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1';
    
    try {
      await pool.query(query, [tokenId]);
    } catch (error) {
      logger.error('Error updating refresh token last used', { error: error.message });
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token) {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const query = 'DELETE FROM refresh_tokens WHERE token_hash = $1';
    
    try {
      await pool.query(query, [tokenHash]);
    } catch (error) {
      logger.error('Error revoking refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokensForUser(userId) {
    const pool = getPool();
    const query = 'DELETE FROM refresh_tokens WHERE user_id = $1';
    
    try {
      await pool.query(query, [userId]);
    } catch (error) {
      logger.error('Error revoking all refresh tokens for user', { error: error.message });
      throw error;
    }
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId) {
    const pool = getPool();
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
    
    const query = `
      INSERT INTO password_reset_tokens (
        id, user_id, token_hash, expires_at
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
    
    try {
      const result = await pool.query(query, [
        uuidv4(),
        userId,
        tokenHash,
        expiresAt
      ]);
      
      return {
        id: result.rows[0].id,
        user_id: userId,
        token: tokenValue
      };
    } catch (error) {
      logger.error('Error creating password reset token', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token) {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const query = `
      SELECT * FROM password_reset_tokens 
      WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL
      LIMIT 1
    `;
    
    try {
      const result = await pool.query(query, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error verifying password reset token', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenUsed(tokenId) {
    const pool = getPool();
    const query = 'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1';
    
    try {
      await pool.query(query, [tokenId]);
    } catch (error) {
      logger.error('Error marking password reset token as used', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const pool = getPool();
    
    try {
      // Clean up expired refresh tokens
      await pool.query('DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP');
      
      // Clean up expired password reset tokens
      await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP');
      
      // Clean up used password reset tokens older than 1 day
      await pool.query(`
        DELETE FROM password_reset_tokens 
        WHERE used_at IS NOT NULL AND used_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
      `);
      
      logger.info('Token cleanup completed');
    } catch (error) {
      logger.error('Error during token cleanup', { error: error.message });
      throw error;
    }
  }
}

module.exports = new TokenService();