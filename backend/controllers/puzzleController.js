// controllers/puzzleController.js
const puzzleService = require('../services/puzzleService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get a random puzzle based on filters
 */
async function getRandomPuzzle(req, res) {
  try {
    const { rating, themes } = req.query;
    const userId = req.user?.id; // Optional for anonymous users

    logger.info('Random puzzle request', { 
      rating, 
      themes, 
      userId,
      ip: req.ip
    });

    const filters = {
      ...(rating && { rating: parseInt(rating) }),
      ...(themes && { themes })
    };

    const result = await puzzleService.getRandomPuzzle(filters, userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Random puzzle retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get random puzzle', { 
      error: error.message, 
      filters: req.query,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('No puzzles found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'RANDOM_PUZZLE_FAILED')
    );
  }
}

/**
 * Get puzzle by ID
 */
async function getPuzzleById(req, res) {
  try {
    const { puzzleId } = req.params;
    const userId = req.user?.id; // Optional for anonymous users

    logger.info('Puzzle by ID request', { 
      puzzleId, 
      userId
    });

    const result = await puzzleService.getPuzzleById(puzzleId, userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Puzzle retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get puzzle by ID', { 
      error: error.message, 
      puzzleId: req.params.puzzleId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PUZZLE_FETCH_FAILED')
    );
  }
}

/**
 * Submit a puzzle attempt
 */
async function submitAttempt(req, res) {
  try {
    const { puzzleId } = req.params;
    const userId = req.user.id;
    const { moves, time_spent_ms, time_spent } = req.body;

    logger.info('Puzzle attempt submission', { 
      puzzleId, 
      userId, 
      moves,
      timeSpentMs: time_spent_ms,
      timeSpentSec: time_spent
    });

    // Normalize moves: accept [["e4","e5"],[...]] or ["e4","e5",...]
    let normalizedMoves = Array.isArray(moves) ? moves : [];
    if (Array.isArray(normalizedMoves[0])) {
      normalizedMoves = normalizedMoves.flat();
    }

    // Normalize time: accept time_spent (seconds) or time_spent_ms (milliseconds)
    const normalizedTimeMs = (
      typeof time_spent_ms === 'number' && !isNaN(time_spent_ms)
    ) ? time_spent_ms : (
      typeof time_spent === 'number' && !isNaN(time_spent) ? Math.round(time_spent * 1000) : 0
    );

    const attemptData = {
      moves: normalizedMoves,
      time_spent_ms: normalizedTimeMs
    };

    const result = await puzzleService.submitAttempt(puzzleId, userId, attemptData);

    const message = result.is_solved ? 
      'Puzzle solved correctly!' : 
      'Incorrect solution. Keep practicing!';

    logger.info('Puzzle attempt result', { 
      puzzleId, 
      userId, 
      isSolved: result.is_solved, 
      ratingChange: result.rating_change
    });

    // Shape data to align with tests expectations (do not expose full solution)
    const responseData = {
      correct: !!result.is_solved,
      rating_change: result.rating_change,
      new_rating: result.new_rating,
      time_spent: Math.round((result.time_spent_ms ?? normalizedTimeMs) / 1000)
    };

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, responseData, message)
    );
  } catch (error) {
    logger.error('Failed to submit puzzle attempt', { 
      error: error.message, 
      puzzleId: req.params.puzzleId,
      userId: req.user?.id,
      attemptData: req.body
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'PUZZLE_ATTEMPT_FAILED')
    );
  }
}

/**
 * Get puzzle categories/themes
 */
async function getCategories(req, res) {
  try {
    logger.info('Puzzle categories request', { 
      requestingUserId: req.user?.id 
    });

    const result = await puzzleService.getCategories();

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Puzzle categories retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get puzzle categories', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'CATEGORIES_FETCH_FAILED')
    );
  }
}

/**
 * Get user's recent puzzle attempts
 */
async function getRecentAttempts(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    logger.info('Recent puzzle attempts request', { 
      userId, 
      limit
    });

    const result = await puzzleService.getUserRecentAttempts(userId, parseInt(limit));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Recent attempts retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get recent attempts', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'RECENT_ATTEMPTS_FAILED')
    );
  }
}

/**
 * Get puzzles by difficulty range
 */
async function getPuzzlesByDifficulty(req, res) {
  try {
    const { 
      min_rating = 400, 
      max_rating = 3000, 
      page = 1, 
      limit = 20 
    } = req.query;

    logger.info('Puzzles by difficulty request', { 
      min_rating, 
      max_rating, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    const result = await puzzleService.getPuzzlesByDifficulty(
      parseInt(min_rating),
      parseInt(max_rating),
      parseInt(page),
      parseInt(limit)
    );

    res.status(HTTP_STATUS.OK).json(
      formatResponse(
        true,
        result,
        'Puzzles retrieved successfully',
        null,
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    logger.error('Failed to get puzzles by difficulty', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'DIFFICULTY_PUZZLES_FAILED')
    );
  }
}

/**
 * Get daily puzzle (placeholder)
 */
async function getDailyPuzzle(req, res) {
  try {
    const userId = req.user?.id;
    const today = new Date().toDateString();

    logger.info('Daily puzzle request', { 
      userId,
      date: today
    });

    // TODO: Implement daily puzzle logic
    // This could involve:
    // - Select a puzzle of the day
    // - Track if user has attempted it
    // - Provide leaderboard for daily puzzle
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Daily puzzle not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get daily puzzle', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'DAILY_PUZZLE_FAILED')
    );
  }
}

/**
 * Get puzzle streak information (placeholder)
 */
async function getPuzzleStreak(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Puzzle streak request', { userId });

    // TODO: Implement puzzle streak tracking
    // This could include:
    // - Current solving streak
    // - Best streak ever
    // - Daily/weekly streaks
    // - Streak rewards/achievements
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Puzzle streak not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get puzzle streak', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PUZZLE_STREAK_FAILED')
    );
  }
}

/**
 * Get puzzle recommendations for user (placeholder)
 */
async function getPuzzleRecommendations(req, res) {
  try {
    const userId = req.user.id;
    const { count = 5 } = req.query;

    logger.info('Puzzle recommendations request', { 
      userId, 
      count
    });

    // TODO: Implement puzzle recommendations
    // Based on user's:
    // - Current puzzle rating
    // - Weak tactical themes
    // - Recent performance
    // - Preferred difficulty progression
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Puzzle recommendations not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get puzzle recommendations', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PUZZLE_RECOMMENDATIONS_FAILED')
    );
  }
}

/**
 * Create custom puzzle set (placeholder)
 */
async function createPuzzleSet(req, res) {
  try {
    const userId = req.user.id;
    const { name, description, puzzle_ids, is_public } = req.body;

    logger.info('Puzzle set creation request', { 
      userId, 
      name,
      puzzleCount: puzzle_ids?.length,
      is_public
    });

    // TODO: Implement custom puzzle sets
    // Allow users to:
    // - Create themed puzzle collections
    // - Share puzzle sets with others
    // - Track progress through sets
    // - Rate and review puzzle sets
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Custom puzzle sets not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to create puzzle set', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PUZZLE_SET_CREATION_FAILED')
    );
  }
}

/**
 * Report puzzle issue (placeholder)
 */
async function reportPuzzleIssue(req, res) {
  try {
    const { puzzleId } = req.params;
    const userId = req.user.id;
    const { issue_type, description } = req.body;

    logger.info('Puzzle issue report', { 
      puzzleId, 
      userId, 
      issue_type
    });

    // TODO: Implement puzzle issue reporting
    // Common issues:
    // - Incorrect solution
    // - Multiple valid solutions
    // - Unclear position
    // - Inappropriate difficulty rating
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Puzzle issue reporting not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to report puzzle issue', { 
      error: error.message, 
      puzzleId: req.params.puzzleId,
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PUZZLE_REPORT_FAILED')
    );
  }
}

/**
 * Get user stats (placeholder)
 */
async function getUserStats(req, res) {
  try {
    const userId = req.user.id;

    logger.info('User stats request', { userId });

    const result = await puzzleService.getUserStats(userId);
    logger.info('User stats result', result);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'User stats retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get user stats', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_STATS_FAILED')
    );
  }
}

/**
 * Get user history (placeholder)
 */
async function getUserHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    logger.info('User history request', { userId, page, limit });

    const result = await puzzleService.getUserHistory(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    logger.info('User history result', { count: result.items?.length, pagination: result.pagination });

    // Normalize pagination into meta while keeping data shape for backward compatibility
    res.status(HTTP_STATUS.OK).json(
      formatResponse(
        true,
        result,
        'User history retrieved successfully',
        null,
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    logger.error('Failed to get user history', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_HISTORY_FAILED')
    );
  }
}

module.exports = {
  getRandomPuzzle,
  getPuzzleById,
  submitAttempt,
  getCategories,
  getRecentAttempts,
  getPuzzlesByDifficulty,
  getDailyPuzzle,
  getPuzzleStreak,
  getPuzzleRecommendations,
  createPuzzleSet,
  reportPuzzleIssue,
  getUserStats,
  getUserHistory
};
