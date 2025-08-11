// controllers/matchmakingController.js
const matchmakingService = require('../services/matchmakingService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Join matchmaking queue
 */
async function joinQueue(req, res) {
  try {
    const userId = req.user.id;
    const { game_type, time_control, rating_range } = req.body;

    logger.info('Matchmaking queue join request', { 
      userId, 
      game_type,
      time_control,
      rating_range,
      ip: req.ip
    });

    const queueData = {
      game_type,
      time_control: time_control || '10+0',
      rating_range: rating_range || undefined
    };

    const result = await matchmakingService.joinQueue(userId, queueData);

    if (result.game) {
      logger.info('Immediate match found', { 
        userId, 
        gameId: result.game.id,
        opponent: result.opponent?.username
      });

      res.status(HTTP_STATUS.OK).json(
        formatResponse(true, result, 'Match found! Game created successfully')
      );
    } else {
      logger.info('Player added to queue', { 
        userId, 
        game_type,
        position: result.position,
        estimatedWaitTime: result.estimatedWaitTime
      });

      res.status(HTTP_STATUS.OK).json(
        formatResponse(true, result, 'Added to matchmaking queue successfully')
      );
    }
  } catch (error) {
    logger.error('Failed to join matchmaking queue', { 
      error: error.message, 
      userId: req.user?.id,
      queueData: req.body
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'QUEUE_JOIN_FAILED')
    );
  }
}

/**
 * Leave matchmaking queue
 */
async function leaveQueue(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Matchmaking queue leave request', { userId });

    const result = await matchmakingService.leaveQueue(userId);

    logger.info('Player left queue', { userId });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Left matchmaking queue successfully')
    );
  } catch (error) {
    logger.error('Failed to leave matchmaking queue', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'QUEUE_LEAVE_FAILED')
    );
  }
}

/**
 * Get current queue status for user
 */
async function getQueueStatus(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Queue status request', { userId });

    const result = await matchmakingService.getQueueStatus(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Queue status retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get queue status', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'QUEUE_STATUS_FAILED')
    );
  }
}

/**
 * Get global queue statistics
 */
async function getQueueStats(req, res) {
  try {
    logger.info('Global queue stats request', { 
      requestingUserId: req.user?.id 
    });

    const result = await matchmakingService.getGlobalStats();

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Queue statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get queue statistics', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'QUEUE_STATS_FAILED')
    );
  }
}

/**
 * Get detailed queue statistics (authenticated)
 */
async function getDetailedStats(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Detailed queue stats request', { userId });

    const result = await matchmakingService.getDetailedStats(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Detailed statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get detailed statistics', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'DETAILED_STATS_FAILED')
    );
  }
}

/**
 * Get user's matchmaking preferences
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Get preferences request', { userId });

    const result = await matchmakingService.getUserPreferences(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Preferences retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get preferences', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'GET_PREFERENCES_FAILED')
    );
  }
}

/**
 * Update user's matchmaking preferences
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    logger.info('Update preferences request', { 
      userId,
      preferences
    });

    const result = await matchmakingService.updateUserPreferences(userId, preferences);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Preferences updated successfully')
    );
  } catch (error) {
    logger.error('Failed to update preferences', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'UPDATE_PREFERENCES_FAILED')
    );
  }
}

/**
 * Get user's queue history
 */
async function getQueueHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    logger.info('Queue history request', { 
      userId,
      page,
      limit
    });

    const result = await matchmakingService.getQueueHistory(userId, parseInt(page), parseInt(limit));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Queue history retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get queue history', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'QUEUE_HISTORY_FAILED')
    );
  }
}

/**
 * Get optimal queue times
 */
async function getOptimalQueueTimes(req, res) {
  try {
    const { game_type, timezone } = req.query;

    logger.info('Optimal queue times request', { 
      game_type,
      timezone,
      requestingUserId: req.user?.id
    });

    const result = await matchmakingService.getOptimalQueueTimes(game_type, timezone);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Optimal queue times retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get optimal queue times', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'OPTIMAL_TIMES_FAILED')
    );
  }
}

/**
 * Cancel pending match
 */
async function cancelMatch(req, res) {
  try {
    const userId = req.user.id;
    const { match_id } = req.body;

    logger.info('Match cancellation request', { 
      userId,
      match_id
    });

    const result = await matchmakingService.cancelMatch(userId, match_id);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Match cancelled successfully')
    );
  } catch (error) {
    logger.error('Failed to cancel match', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'MATCH_CANCEL_FAILED')
    );
  }
}

/**
 * Report matchmaking issues
 */
async function reportIssue(req, res) {
  try {
    const userId = req.user.id;
    const { issue_type, description, queue_session_id } = req.body;

    logger.info('Matchmaking issue report', { 
      userId,
      issue_type,
      queue_session_id
    });

    const result = await matchmakingService.reportIssue(userId, {
      issue_type,
      description,
      queue_session_id
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Issue reported successfully')
    );
  } catch (error) {
    logger.error('Failed to report matchmaking issue', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ISSUE_REPORT_FAILED')
    );
  }
}

/**
 * Get admin queue data (admin only)
 */
async function getAdminQueueData(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Admin queue data request', { userId });

    // TODO: Add admin role check
    const result = await matchmakingService.getAdminQueueData();

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Admin queue data retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get admin queue data', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ADMIN_QUEUE_DATA_FAILED')
    );
  }
}

module.exports = {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  getQueueStats,
  getDetailedStats,
  getPreferences,
  updatePreferences,
  getQueueHistory,
  getOptimalQueueTimes,
  cancelMatch,
  reportIssue,
  getAdminQueueData
};