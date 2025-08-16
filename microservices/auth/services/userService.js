// microservices/auth/services/userService.js
const { getPool } = require('../database/connection');
const logger = require('../utils/logger');

class UserService {
  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(username, email) {
    const pool = getPool();
    const query = `
      SELECT * FROM users 
      WHERE username = $1 OR email = $2
      LIMIT 1
    `;
    
    try {
      const result = await pool.query(query, [username, email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username or email', { error: error.message });
      throw error;
    }
  }

  /**
   * Find user by email only
   */
  async findByEmail(email) {
    const pool = getPool();
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { error: error.message });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    const pool = getPool();
    const query = 'SELECT * FROM users WHERE id = $1 LIMIT 1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const pool = getPool();
    const query = `
      INSERT INTO users (
        id, username, email, password_hash, display_name, country
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        userData.id,
        userData.username,
        userData.email,
        userData.password_hash,
        userData.display_name,
        userData.country
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId) {
    const pool = getPool();
    const query = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    
    try {
      await pool.query(query, [userId]);
    } catch (error) {
      logger.error('Error updating last login', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, passwordHash) {
    const pool = getPool();
    const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    
    try {
      await pool.query(query, [passwordHash, userId]);
    } catch (error) {
      logger.error('Error updating password', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const pool = getPool();
    const allowedFields = ['display_name', 'bio', 'country', 'avatar_url'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic query based on provided fields
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${paramIndex}
      RETURNING *
    `;
    values.push(userId);

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user profile', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    const pool = getPool();
    // This would typically join with other service databases
    // For now, return basic user info
    const query = `
      SELECT 
        id, username, display_name, country, 
        created_at, last_login_at, is_verified, is_premium
      FROM users 
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();