// controllers/matchmakingController.js
const matchmakingService = require('../services/matchmakingService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
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
        formatSuccessResponse(result, 'Match found! Game created successfully')
      );
    } else {
      logger.info('Player added to queue', { 
        userId, 
        game_type,
        position: result.position,
        estimatedWaitTime: result.estimatedWaitTime
      });

      res.status(HTTP_STATUS.OK).json(
        formatSuccessResponse(result, 'Added to matchmaking queue successfully')
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
      formatErrorResponse(error.message, 'QUEUE_JOIN_FAILED')
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
      formatSuccessResponse(result, 'Left matchmaking queue successfully')
    );
  } catch (error) {
    logger.error('Failed to leave matchmaking queue', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'QUEUE_LEAVE_FAILED')
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
      formatSuccessResponse(result, 'Queue status retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get queue status', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'QUEUE_STATUS_FAILED')
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

    // Get queue sizes for all game types
    const queueStats = {
      rapid: matchmakingService.queues.rapid.length,
      blitz: matchmakingService.queues.blitz.length,
      bullet: matchmakingService.queues.bullet.length,
      total: matchmakingService.queues.rapid.length + 
             matchmakingService.queues.blitz.length + 
             matchmakingService.queues.bullet.length,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(queueStats, 'Queue statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get queue statistics', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'QUEUE_STATS_FAILED')
    );
  }
}

/**
 * Update queue preferences (placeholder)
 */
async function updateQueuePreferences(req, res) {
  try {
    const userId = req.user.id;
    const { 
      preferred_time_controls, 
      rating_range_flexibility, 
      auto_accept_matches 
    } = req.body;

    logger.info('Queue preferences update request', { 
      userId,
      preferences: req.body
    });

    // TODO: Implement queue preferences storage
    // This could include:
    // - Preferred time controls
    // - Rating range flexibility
    // - Auto-accept match settings
    // - Blocked opponents list
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Queue preferences not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to update queue preferences', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'QUEUE_PREFERENCES_FAILED')
    );
  }
}

/**
 * Get queue history for user (placeholder)
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

    // TODO: Implement queue history tracking
    // This could include:
    // - Previous queue sessions
    // - Wait times
    // - Match success rate
    // - Cancelled queue sessions
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Queue history not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get queue history', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'QUEUE_HISTORY_FAILED')
    );
  }
}

/**
 * Cancel pending match (placeholder)
 */
async function cancelMatch(req, res) {
  try {
    const userId = req.user.id;
    const { match_id } = req.body;

    logger.info('Match cancellation request', { 
      userId,
      match_id
    });

    // TODO: Implement match cancellation
    // This would allow users to cancel matches before they start
    // (useful for when match is found but game hasn't started yet)
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Match cancellation not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to cancel match', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'MATCH_CANCEL_FAILED')
    );
  }
}

/**
 * Report matchmaking issues (placeholder)
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

    // TODO: Implement issue reporting
    // Common issues might include:
    // - Long wait times
    // - Inappropriate skill matches
    // - Connection problems
    // - Opponent behavior issues
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Issue reporting not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to report matchmaking issue', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'ISSUE_REPORT_FAILED')
    );
  }
}

/**
 * Get optimal queue times (placeholder)
 */
async function getOptimalQueueTimes(req, res) {
  try {
    const { game_type, timezone } = req.query;

    logger.info('Optimal queue times request', { 
      game_type,
      timezone,
      requestingUserId: req.user?.id
    });

    // TODO: Implement optimal queue time analysis
    // This could provide insights like:
    // - Peak hours for each game type
    // - Average wait times by hour
    // - Best times for specific rating ranges
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Optimal queue times not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get optimal queue times', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'OPTIMAL_TIMES_FAILED')
    );
  }
}

module.exports = {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  getQueueStats,
  updateQueuePreferences,
  getQueueHistory,
  cancelMatch,
  reportIssue,
  getOptimalQueueTimes
};