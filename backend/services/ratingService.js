// services/ratingService.js
const db = require('../models');
const logger = require('../utils/logger');

class RatingService {
  /**
   * Get leaderboard
   */
  async getLeaderboard(ratingType = 'rapid', page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const ratingField = `rating_${ratingType}`;

      const { count, rows } = await db.User.findAndCountAll({
        where: {
          games_played: { [db.Sequelize.Op.gte]: 10 }, // At least 10 games played
          is_active: true
        },
        attributes: [
          'id', 'username', 'display_name', 'avatar_url', 'country',
          ratingField, 'games_played', 'games_won', 'games_lost', 'games_drawn'
        ],
        order: [[ratingField, 'DESC']],
        limit,
        offset
      });

      const leaderboard = rows.map((user, index) => ({
        rank: offset + index + 1,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          country: user.country
        },
        rating: user[ratingField],
        games_played: user.games_played,
        games_won: user.games_won,
        games_lost: user.games_lost,
        games_drawn: user.games_drawn,
        win_rate: user.games_played > 0 ? 
          ((user.games_won / user.games_played) * 100).toFixed(1) : 0
      }));

      return {
        leaderboard,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: offset + limit < count,
          hasPrev: page > 1
        },
        rating_type: ratingType
      };
    } catch (error) {
      logger.error('Failed to get leaderboard', { error: error.message, ratingType });
      throw error;
    }
  }

  /**
   * Get user's position in leaderboard
   */
  async getUserRank(userId, ratingType = 'rapid') {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const ratingField = `rating_${ratingType}`;
      const userRating = user[ratingField];

      const higherRatedCount = await db.User.count({
        where: {
          [ratingField]: { [db.Sequelize.Op.gt]: userRating },
          games_played: { [db.Sequelize.Op.gte]: 10 },
          is_active: true
        }
      });

      return {
        rank: higherRatedCount + 1,
        rating: userRating,
        rating_type: ratingType
      };
    } catch (error) {
      logger.error('Failed to get user rank', { error: error.message, userId, ratingType });
      throw error;
    }
  }
}

module.exports = new RatingService();
