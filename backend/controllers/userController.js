// controllers/userController.js
const userService = require('../services/userService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get user profile (public or own)
 */
async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id; // May be null for public access

    logger.info('User profile request', { 
      userId, 
      requestingUserId,
      ip: req.ip
    });

    const result = await userService.getUserProfile(userId, requestingUserId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Profile retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get user profile', { 
      error: error.message, 
      userId: req.params.userId,
      requestingUserId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PROFILE_FETCH_FAILED')
    );
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    logger.info('Profile update attempt', { 
      userId, 
      fields: Object.keys(updateData)
    });

    const result = await userService.updateProfile(userId, updateData);

    logger.info('Profile updated successfully', { userId });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Profile updated successfully')
    );
  } catch (error) {
    logger.error('Failed to update profile', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, error.message, 'PROFILE_UPDATE_FAILED')
    );
  }
}

/**
 * Search users
 */
async function searchUsers(req, res) {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    logger.info('User search request', { 
      query, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    const result = await userService.searchUsers(query, parseInt(page), parseInt(limit));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(
        true,
        result,
        'Search completed successfully',
        null,
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    logger.error('Failed to search users', { 
      error: error.message, 
      query: req.query.q 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_SEARCH_FAILED')
    );
  }
}

/**
 * Get user statistics
 */
async function getUserStats(req, res) {
  try {
    const { userId } = req.params;

    logger.info('User stats request', { 
      userId,
      requestingUserId: req.user?.id
    });

    const result = await userService.getUserStats(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get user stats', { 
      error: error.message, 
      userId: req.params.userId 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'STATS_FETCH_FAILED')
    );
  }
}

/**
 * Get user preferences
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Preferences fetch request', { userId });

    const result = await userService.getPreferences(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Preferences retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get preferences', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PREFERENCES_FETCH_FAILED')
    );
  }
}

/**
 * Update user preferences
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    logger.info('Preferences update attempt', { 
      userId, 
      fields: Object.keys(updateData)
    });

    const result = await userService.updatePreferences(userId, updateData);

    logger.info('Preferences updated successfully', { userId });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Preferences updated successfully')
    );
  } catch (error) {
    logger.error('Failed to update preferences', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, error.message, 'PREFERENCES_UPDATE_FAILED')
    );
  }
}

/**
 * Get user's rating history
 */
async function getRatingHistory(req, res) {
  try {
    const { userId } = req.params;
    const { type = 'rapid', limit = 50 } = req.query;

    logger.info('Rating history request', { 
      userId, 
      type, 
      limit,
      requestingUserId: req.user?.id
    });

    const result = await userService.getRatingHistory(userId, type, parseInt(limit));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Rating history retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get rating history', { 
      error: error.message, 
      userId: req.params.userId 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'RATING_HISTORY_FAILED')
    );
  }
}

/**
 * Get user's puzzle statistics
 */
async function getPuzzleStats(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Puzzle stats request', { userId });

    const result = await userService.getPuzzleStats(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Puzzle statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get puzzle stats', { 
      error: error.message, 
      userId: req.user?.id 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PUZZLE_STATS_FAILED')
    );
  }
}

/**
 * Get user's recent activity
 */
async function getRecentActivity(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    logger.info('Recent activity request', { 
      userId, 
      limit,
      requestingUserId: req.user?.id
    });

    // TODO: Implement recent activity service method
    // This could include recent games, puzzle attempts, achievements, etc.
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Recent activity not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get recent activity', { 
      error: error.message, 
      userId: req.params.userId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'RECENT_ACTIVITY_FAILED')
    );
  }
}

/**
 * Get user's achievements (placeholder)
 */
async function getAchievements(req, res) {
  try {
    const { userId } = req.params;

    logger.info('Achievements request', { 
      userId,
      requestingUserId: req.user?.id
    });

    // TODO: Implement achievements system
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Achievements not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get achievements', { 
      error: error.message, 
      userId: req.params.userId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ACHIEVEMENTS_FAILED')
    );
  }
}

/**
 * Upload user avatar (placeholder)
 */
async function uploadAvatar(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Avatar upload attempt', { userId });

    // TODO: Implement avatar upload logic
    // This would typically involve:
    // 1. File upload handling (multer)
    // 2. Image processing/resizing
    // 3. Storage (local/cloud)
    // 4. Database update
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Avatar upload not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to upload avatar', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'AVATAR_UPLOAD_FAILED')
    );
  }
}

/**
 * Delete user account (placeholder)
 */
async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    logger.info('Account deletion attempt', { userId });

    // TODO: Implement account deletion logic
    // This would typically involve:
    // 1. Password verification
    // 2. Data cleanup/anonymization
    // 3. Account deactivation
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Account deletion not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to delete account', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ACCOUNT_DELETION_FAILED')
    );
  }
}

module.exports = {
  getUserProfile,
  updateProfile,
  searchUsers,
  getUserStats,
  getPreferences,
  updatePreferences,
  getRatingHistory,
  getPuzzleStats,
  getRecentActivity,
  getAchievements,
  uploadAvatar,
  deleteAccount
};
