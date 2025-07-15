// controllers/ratingController.js
const ratingService = require('../services/ratingService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get leaderboard for specified rating type
 */
async function getLeaderboard(req, res) {
  try {
    const { 
      type = 'rapid', 
      page = 1, 
      limit = 50 
    } = req.query;

    logger.info('Leaderboard request', { 
      type, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    // Validate rating type
    const validTypes = ['rapid', 'blitz', 'bullet', 'puzzle'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid rating type. Must be one of: ' + validTypes.join(', '), 'INVALID_RATING_TYPE')
      );
    }

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const result = await ratingService.getLeaderboard(type, pageNum, limitNum);

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(result, 'Leaderboard retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get leaderboard', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'LEADERBOARD_FAILED')
    );
  }
}

/**
 * Get user's rank in leaderboard
 */
async function getUserRank(req, res) {
  try {
    const { userId } = req.params;
    const { type = 'rapid' } = req.query;

    logger.info('User rank request', { 
      userId, 
      type,
      requestingUserId: req.user?.id
    });

    // Validate rating type
    const validTypes = ['rapid', 'blitz', 'bullet', 'puzzle'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid rating type. Must be one of: ' + validTypes.join(', '), 'INVALID_RATING_TYPE')
      );
    }

    const result = await ratingService.getUserRank(userId, type);

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(result, 'User rank retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get user rank', { 
      error: error.message, 
      userId: req.params.userId,
      type: req.query.type
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatErrorResponse(error.message, 'USER_RANK_FAILED')
    );
  }
}

/**
 * Get global rating statistics
 */
async function getGlobalStats(req, res) {
  try {
    const { type = 'rapid' } = req.query;

    logger.info('Global rating stats request', { 
      type,
      requestingUserId: req.user?.id
    });

    // TODO: Implement global rating statistics
    // This could include:
    // - Average ratings by game type
    // - Rating distribution percentiles
    // - Total number of rated players
    // - Rating inflation/deflation trends
    // - Top rating gains/losses of the week/month
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Global rating statistics not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get global rating stats', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'GLOBAL_STATS_FAILED')
    );
  }
}

/**
 * Get rating distribution data
 */
async function getRatingDistribution(req, res) {
  try {
    const { type = 'rapid' } = req.query;

    logger.info('Rating distribution request', { 
      type,
      requestingUserId: req.user?.id
    });

    // TODO: Implement rating distribution analysis
    // This would show:
    // - Number of players in each rating range (0-999, 1000-1199, etc.)
    // - Percentile breakdowns
    // - Bell curve visualization data
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Rating distribution not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get rating distribution', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'RATING_DISTRIBUTION_FAILED')
    );
  }
}

/**
 * Get top gainers/losers
 */
async function getTopMovers(req, res) {
  try {
    const { 
      type = 'rapid', 
      period = 'week',
      direction = 'gainers',
      limit = 10 
    } = req.query;

    logger.info('Top movers request', { 
      type, 
      period,
      direction,
      limit,
      requestingUserId: req.user?.id
    });

    // Validate parameters
    const validPeriods = ['day', 'week', 'month'];
    const validDirections = ['gainers', 'losers'];
    
    if (!validPeriods.includes(period)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid period. Must be one of: ' + validPeriods.join(', '), 'INVALID_PERIOD')
      );
    }

    if (!validDirections.includes(direction)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid direction. Must be one of: ' + validDirections.join(', '), 'INVALID_DIRECTION')
      );
    }

    // TODO: Implement top movers calculation
    // This would analyze recent rating changes and return:
    // - Players with biggest rating gains/losses
    // - Time period for the analysis
    // - Actual rating change amounts
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Top movers not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get top movers', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'TOP_MOVERS_FAILED')
    );
  }
}

/**
 * Get rating progress for user
 */
async function getRatingProgress(req, res) {
  try {
    const { userId } = req.params;
    const { 
      type = 'rapid', 
      period = '6months',
      limit = 100 
    } = req.query;

    logger.info('Rating progress request', { 
      userId, 
      type,
      period,
      limit,
      requestingUserId: req.user?.id
    });

    // TODO: Implement rating progress tracking
    // This would return:
    // - Rating history over time
    // - Peak/lowest ratings
    // - Trend analysis (improving/declining)
    // - Recent performance streaks
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Rating progress not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get rating progress', { 
      error: error.message, 
      userId: req.params.userId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'RATING_PROGRESS_FAILED')
    );
  }
}

/**
 * Get country/region leaderboards
 */
async function getCountryLeaderboard(req, res) {
  try {
    const { 
      country,
      type = 'rapid',
      page = 1,
      limit = 50 
    } = req.query;

    logger.info('Country leaderboard request', { 
      country, 
      type,
      page,
      limit,
      requestingUserId: req.user?.id
    });

    if (!country) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Country parameter is required', 'COUNTRY_REQUIRED')
      );
    }

    // TODO: Implement country-specific leaderboards
    // Filter leaderboard by user's country
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Country leaderboards not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get country leaderboard', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'COUNTRY_LEADERBOARD_FAILED')
    );
  }
}

/**
 * Get age group leaderboards (placeholder)
 */
async function getAgeGroupLeaderboard(req, res) {
  try {
    const { 
      age_group,
      type = 'rapid',
      page = 1,
      limit = 50 
    } = req.query;

    logger.info('Age group leaderboard request', { 
      age_group, 
      type,
      requestingUserId: req.user?.id
    });

    // TODO: Implement age group leaderboards
    // This would require birth date in user profiles
    // Age groups could be: U12, U16, U18, Adult, Senior
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Age group leaderboards not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get age group leaderboard', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'AGE_GROUP_LEADERBOARD_FAILED')
    );
  }
}

/**
 * Get provisional ratings info (placeholder)
 */
async function getProvisionalInfo(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Provisional ratings info request', { userId });

    // TODO: Implement provisional rating system
    // Show information about:
    // - How many games needed for established rating
    // - Current provisional status
    // - Rating reliability/uncertainty
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Provisional ratings info not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get provisional info', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'PROVISIONAL_INFO_FAILED')
    );
  }
}

/**
 * Get rating comparison between users (placeholder)
 */
async function compareRatings(req, res) {
  try {
    const { user1_id, user2_id, type = 'rapid' } = req.query;

    logger.info('Rating comparison request', { 
      user1_id, 
      user2_id, 
      type,
      requestingUserId: req.user?.id
    });

    if (!user1_id || !user2_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Both user1_id and user2_id are required', 'USERS_REQUIRED')
      );
    }

    // TODO: Implement rating comparison
    // Show:
    // - Current ratings for both users
    // - Rating history comparison
    // - Head-to-head game results
    // - Rating difference trends
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Rating comparison not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to compare ratings', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'RATING_COMPARISON_FAILED')
    );
  }
}

module.exports = {
  getLeaderboard,
  getUserRank,
  getGlobalStats,
  getRatingDistribution,
  getTopMovers,
  getRatingProgress,
  getCountryLeaderboard,
  getAgeGroupLeaderboard,
  getProvisionalInfo,
  compareRatings
};