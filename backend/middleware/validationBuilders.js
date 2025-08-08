// middleware/validationBuilders.js
const { body, query, param } = require('express-validator');

/**
 * Reusable validation building blocks
 */

// Common field validators
const validators = {
  // Pagination
  paginationPage: () => 
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1-1000')
      .toInt(),

  paginationLimit: () =>
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100')
      .toInt(),

  // UUID parameter
  uuidParam: (paramName = 'id') =>
    param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`),

  // Game types
  gameType: () =>
    body('game_type')
      .optional()
      .isIn(['bullet', 'blitz', 'rapid', 'classical', 'correspondence'])
      .withMessage('Invalid game type'),

  // Time control
  timeControl: () =>
    body('time_control')
      .optional()
      .matches(/^\d+\+\d+$/)
      .withMessage('Time control must be in format "minutes+increment" (e.g., "10+5")'),

  // Boolean flags
  isRated: () =>
    body('is_rated')
      .optional()
      .isBoolean()
      .withMessage('is_rated must be boolean')
      .toBoolean(),

  // Chess move
  chessMove: () =>
    body('move')
      .trim()
      .notEmpty()
      .withMessage('Move is required')
      .isLength({ max: 10 })
      .withMessage('Move must not exceed 10 characters'),

  // Search query
  searchQuery: () =>
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters')
};

/**
 * Pre-built common validation arrays
 */
const commonValidations = {
  pagination: [
    validators.paginationPage(),
    validators.paginationLimit()
  ],

  gameQuery: [
    validators.paginationPage(),
    validators.paginationLimit(),
    query('game_type')
      .optional()
      .isIn(['bullet', 'blitz', 'rapid', 'classical', 'correspondence'])
      .withMessage('Invalid game type'),
    query('status')
      .optional()
      .isIn(['waiting', 'active', 'finished'])
      .withMessage('Invalid status'),
    query('is_rated')
      .optional()
      .isBoolean()
      .withMessage('is_rated must be boolean')
      .toBoolean()
  ]
};

module.exports = {
  validators,
  commonValidations
};
