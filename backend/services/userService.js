// services/userService.js
const db = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class UserService {
  /**
   * Get user profile (public or private view)
   */
  async getUserProfile(userId, requestingUserId = null) {
    try {
      const isOwnProfile = requestingUserId === userId;
      
      const user = await db.User.findByPk(userId, {
        attributes: isOwnProfile ? 
          { exclude: ['password_hash'] } : 
          [
            'id', 'username', 'display_name', 'avatar_url', 'country', 'bio',
            'rating_rapid', 'rating_blitz', 'rating_bullet', 'rating_puzzle',
            'games_played', 'games_won', 'games_lost', 'games_drawn',
            'puzzles_solved', 'puzzles_attempted', 'is_verified', 'created_at'
          ],
        ...(isOwnProfile && {
          include: [{
            model: db.UserPreferences,
            as: 'preferences'
          }]
        })
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_active) {
        throw new Error('User account is not active');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const allowedFields = ['display_name', 'bio', 'country', 'avatar_url'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No valid fields to update');
      }

      filteredData.updated_at = new Date();

      await db.User.update(filteredData, {
        where: { id: userId }
      });

      logger.info('User profile updated', { userId, fields: Object.keys(filteredData) });
      
      return await this.getUserProfile(userId, userId);
    } catch (error) {
      logger.error('Failed to update profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await db.User.findAndCountAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { username: { [Op.iLike]: `%${query}%` } },
                { display_name: { [Op.iLike]: `%${query}%` } }
              ]
            },
            { is_active: true }
          ]
        },
        attributes: [
          'id', 'username', 'display_name', 'avatar_url', 'country',
          'rating_rapid', 'rating_blitz', 'rating_bullet', 'rating_puzzle',
          'games_played', 'is_verified', 'created_at'
        ],
        order: [
          ['rating_rapid', 'DESC'],
          ['games_played', 'DESC']
        ],
        limit,
        offset
      });

      return {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: offset + limit < count,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to search users', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate win rate
      const totalGames = user.games_played;
      const winRate = totalGames > 0 ? ((user.games_won / totalGames) * 100).toFixed(1) : 0;

      // Get recent rating history
      const ratingHistory = await db.Rating.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 20
      });

      // Get recent games with basic info
      const recentGames = await db.Game.findAll({
        include: [{
          model: db.Player,
          as: 'players',
          where: { user_id: userId },
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'display_name', 'rating_rapid']
          }]
        }],
        where: { status: 'finished' },
        order: [['finished_at', 'DESC']],
        limit: 10,
        attributes: [
          'id', 'game_type', 'result', 'result_reason',
          'started_at', 'finished_at', 'move_count'
        ]
      });

      // Calculate puzzle stats
      const puzzleSuccessRate = user.puzzles_attempted > 0 ? 
        ((user.puzzles_solved / user.puzzles_attempted) * 100).toFixed(1) : 0;

      return {
        games_played: user.games_played,
        games_won: user.games_won,
        games_lost: user.games_lost,
        games_drawn: user.games_drawn,
        win_rate: parseFloat(winRate),
        current_ratings: {
          rapid: user.rating_rapid,
          blitz: user.rating_blitz,
          bullet: user.rating_bullet,
          puzzle: user.rating_puzzle
        },
        puzzle_stats: {
          solved: user.puzzles_solved,
          attempted: user.puzzles_attempted,
          success_rate: parseFloat(puzzleSuccessRate)
        },
        rating_history: ratingHistory,
        recent_games: recentGames
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId) {
    try {
      let preferences = await db.UserPreferences.findOne({
        where: { user_id: userId }
      });

      if (!preferences) {
        // Create default preferences if they don't exist
        preferences = await db.UserPreferences.create({ 
          user_id: userId 
        });
      }

      return preferences;
    } catch (error) {
      logger.error('Failed to get preferences', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, updateData) {
    try {
      const [preferences, created] = await db.UserPreferences.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId, ...updateData }
      });

      if (!created) {
        updateData.updated_at = new Date();
        await db.UserPreferences.update(updateData, {
          where: { user_id: userId }
        });
      }

      logger.info('User preferences updated', { userId });
      
      return await this.getPreferences(userId);
    } catch (error) {
      logger.error('Failed to update preferences', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user's rating history
   */
  async getRatingHistory(userId, ratingType = 'rapid', limit = 50) {
    try {
      const history = await db.Rating.findAll({
        where: { 
          user_id: userId,
          rating_type: ratingType
        },
        order: [['created_at', 'ASC']],
        limit,
        include: [{
          model: db.Game,
          as: 'game',
          attributes: ['id', 'game_type', 'result', 'finished_at']
        }]
      });

      return history;
    } catch (error) {
      logger.error('Failed to get rating history', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get puzzle statistics for user
   */
  async getPuzzleStats(userId) {
    try {
      const user = await db.User.findByPk(userId, {
        attributes: ['puzzles_solved', 'puzzles_attempted', 'rating_puzzle']
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get recent puzzle attempts
      const recentAttempts = await db.PuzzleAttempt.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 20,
        include: [{
          model: db.Puzzle,
          as: 'puzzle',
          attributes: ['id', 'rating', 'themes']
        }]
      });

      // Calculate statistics by theme
      const themeStats = {};
      recentAttempts.forEach(attempt => {
        const themes = attempt.puzzle.themes || [];
        themes.forEach(theme => {
          if (!themeStats[theme]) {
            themeStats[theme] = { attempted: 0, solved: 0 };
          }
          themeStats[theme].attempted++;
          if (attempt.is_solved) {
            themeStats[theme].solved++;
          }
        });
      });

      // Calculate success rates
      Object.keys(themeStats).forEach(theme => {
        const stats = themeStats[theme];
        stats.success_rate = ((stats.solved / stats.attempted) * 100).toFixed(1);
      });

      const overallSuccessRate = user.puzzles_attempted > 0 ? 
        ((user.puzzles_solved / user.puzzles_attempted) * 100).toFixed(1) : 0;

      return {
        total_attempted: user.puzzles_attempted,
        total_solved: user.puzzles_solved,
        success_rate: parseFloat(overallSuccessRate),
        current_rating: user.rating_puzzle,
        theme_stats: themeStats,
        recent_attempts: recentAttempts
      };
    } catch (error) {
      logger.error('Failed to get puzzle stats', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new UserService();