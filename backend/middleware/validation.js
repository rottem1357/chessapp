// middleware/validation.js
const { isUUID } = require('validator');
const { body, query, param, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const { validators, commonValidations } = require('./validationBuilders');

/**
 * Handle validation errors middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, { errors: errorMessages }, 'Validation failed', 'VALIDATION_001')
    );
  }
  next();
};

// =============================================================================
/**
 * Validate userId route param as UUID
 */
const validateUserIdParam = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors
];
// AUTHENTICATION VALIDATIONS
// =============================================================================

/**
 * Validate user registration
 */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be exactly 2 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase(),
  
  handleValidationErrors
];

/**
 * Validate user login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required')
    .isLength({ max: 255 })
    .withMessage('Username/email must not exceed 255 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters'),
  
  handleValidationErrors
];

/**
 * Validate password reset request
 */
const validatePasswordResetRequest = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  handleValidationErrors
];

/**
 * Validate password reset confirmation
 */
const validatePasswordResetConfirm = [
  body('reset_token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isUUID()
    .withMessage('Reset token must be a valid UUID'),
  
  body('new_password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// =============================================================================
// USER MANAGEMENT VALIDATIONS
// =============================================================================

/**
 * Validate profile update
 */
const validateUpdateProfile = [
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be exactly 2 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase(),
  
  body('avatar_url')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Avatar URL must be a valid HTTPS URL')
      .isLength({ max: 500 })
      .withMessage('Avatar URL must not exceed 500 characters'),
  
    handleValidationErrors
  ];

  /**
   * Validate update queue preferences
   */
  const validateUpdatePreferences = [
    body('preferredTimeControls')
      .optional()
      .isArray()
      .withMessage('Preferred time controls must be an array'),
    body('preferredTimeControls.*')
      .optional()
      .matches(/^\d+\+\d+$/)
      .withMessage('Each time control must be in format "minutes+increment"'),
    body('maxRatingRange')
      .optional()
      .isInt({ min: 50, max: 1000 })
      .withMessage('Max rating range must be between 50-1000')
      .toInt(),
    body('autoAcceptMatches')
      .optional()
      .isBoolean()
      .withMessage('Auto accept matches must be boolean')
      .toBoolean(),
    body('notificationsEnabled')
      .optional()
      .isBoolean()
      .withMessage('Notifications enabled must be boolean')
      .toBoolean(),
    body('preferredGameTypes')
      .optional()
      .isArray()
      .withMessage('Preferred game types must be an array'),
    body('preferredGameTypes.*')
      .optional()
      .isIn(['rapid', 'blitz', 'bullet'])
      .withMessage('Each game type must be rapid, blitz, or bullet'),
    handleValidationErrors
  ];

  /**
   * Validate optimal queue times query
   */
  const validateOptimalTimesQuery = [
    query('game_type')
      .optional()
      .isIn(['rapid', 'blitz', 'bullet'])
      .withMessage('Game type must be rapid, blitz, or bullet'),
    query('timezone')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Timezone must be 1-50 characters'),
    handleValidationErrors
  ];

  /**
   * Validate cancel match request
   */
  const validateCancelMatch = [
    body('match_id')
      .notEmpty()
      .withMessage('Match ID is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Match ID must be 1-100 characters'),
    handleValidationErrors
  ];

  /**
   * Validate issue report
   */
  const validateReportIssue = [
    body('issue_type')
      .isIn(['long_wait', 'unfair_match', 'connection_issue', 'other'])
      .withMessage('Issue type must be: long_wait, unfair_match, connection_issue, or other'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be 10-500 characters'),
    body('queue_session_id')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Queue session ID must be 1-100 characters'),
    handleValidationErrors
  ];


/**
 * Validate user search
 */
const validateUserSearch = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Search query must be between 3-50 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Search query contains invalid characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1-1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1-50')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validate user preferences update
 */
const validateUserPreferences = [
  body('board_theme')
    .optional()
    .isIn(['green', 'brown', 'blue', 'grey', 'wood', 'marble'])
    .withMessage('Invalid board theme'),
  
  body('piece_set')
    .optional()
    .isIn(['classic', 'modern', 'medieval', 'fantasy', 'minimalist'])
    .withMessage('Invalid piece set'),
  
  body('sound_enabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean'),
  
  body('move_sound')
    .optional()
    .isIn(['standard', 'wood', 'futuristic', 'silent'])
    .withMessage('Invalid move sound'),
  
  body('show_coordinates')
    .optional()
    .isBoolean()
    .withMessage('Show coordinates must be a boolean'),

  body('highlight_moves')
    .optional()
    .isBoolean()
    .withMessage('Highlight moves must be a boolean'),

  body('show_legal_moves')
    .optional()
    .isBoolean()
    .withMessage('Show legal moves must be a boolean'),
  
  body('auto_queen_promotion')
    .optional()
    .isBoolean()
    .withMessage('Auto queen promotion must be a boolean'),
  
  body('confirm_resignation')
    .optional()
    .isBoolean()
    .withMessage('Confirm resignation must be a boolean'),
  
  body('enable_premoves')
    .optional()
    .isBoolean()
    .withMessage('Enable premoves must be a boolean'),
  
  body('show_chat')
    .optional()
    .isBoolean()
    .withMessage('Show chat must be a boolean'),
  
  body('allow_challenges')
    .optional()
    .isBoolean()
    .withMessage('Allow challenges must be a boolean'),
  
  body('allow_friend_requests')
    .optional()
    .isBoolean()
    .withMessage('Allow friend requests must be a boolean'),
  
  body('email_notifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('game_notifications')
    .optional()
    .isBoolean()
    .withMessage('Game notifications must be a boolean'),
  
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),
  
  body('language')
    .optional()
    .trim()
    .matches(/^[a-z]{2}(_[A-Z]{2})?$/)
    .withMessage('Language must be in format "en" or "en_US"'),
  
  handleValidationErrors
];

// =============================================================================
// GAME VALIDATIONS
// =============================================================================

/**
 * Validate game creation
 */
const validateCreateGame = [
  body('game_type')
    .optional()
    .isIn(['rapid', 'blitz', 'bullet', 'classical', 'correspondence'])
    .withMessage('Game type must be rapid, blitz, bullet, classical, or correspondence'),
  
  body('time_control')
    .optional()
    .matches(/^\d+\+\d+$/)
    .withMessage('Time control must be in format "minutes+increment" (e.g., "10+0")')
    .custom((value) => {
      const [minutes, increment] = value.split('+').map(Number);
      if (minutes < 0.5 || minutes > 180) {
        throw new Error('Time limit must be between 0.5 and 180 minutes');
      }
      if (increment < 0 || increment > 60) {
        throw new Error('Increment must be between 0 and 60 seconds');
      }
      return true;
    }),
  
  body('time_limit_seconds')
    .optional()
    .isInt({ min: 30, max: 10800 }) // 30 seconds to 3 hours
    .withMessage('Time limit must be between 30 seconds and 3 hours')
    .toInt(),
  
  body('increment_seconds')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Increment must be between 0-60 seconds')
    .toInt(),
  
  body('is_rated')
    .optional()
    .isBoolean()
    .withMessage('Is rated must be a boolean'),
  
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('Is private must be a boolean'),
  
  body('password')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Password must be between 1-50 characters'),
  
  // Custom validation for private games requiring password
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('Is private must be a boolean')
    .custom((value, { req }) => {
      if (value === true && (!req.body.password || req.body.password.trim() === '')) {
        throw new Error('Password is required for private games');
      }
      return true;
    }),

  body('preferred_color')
    .optional()
    .isIn(['white', 'black', 'random'])
    .withMessage('Preferred color must be white, black, or random'),
  
  handleValidationErrors
];

/**
 * Validate joining a game
 */
const validateJoinGame = [
  validators.uuidParam('gameId'),
  
  body('password')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Password must be between 1-50 characters'),
  
  handleValidationErrors
];

/**
 * Validate making a move
 */
const validateMakeMove = [
  validators.uuidParam('gameId'),
  
  body('move')
    .trim()
    .notEmpty()
    .withMessage('Move is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Move must be between 2-10 characters'),
  
  body('time_spent_ms')
    .optional()
    .isInt({ min: 0, max: 3600000 }) // Max 1 hour per move
    .withMessage('Time spent must be between 0 and 3600000 milliseconds')
    .toInt(),
  
  body('promotion')
    .optional()
    .isIn(['q', 'r', 'b', 'n', 'Q', 'R', 'B', 'N'])
    .withMessage('Promotion piece must be q, r, b, or n')
    .toLowerCase(),
  
  handleValidationErrors
];

/**
 * Validate game query parameters
 */
const validateGameQuery = [
  ...commonValidations.pagination,
  query('game_type')
    .optional()
    .isIn(['rapid', 'blitz', 'bullet', 'classical', 'correspondence'])
    .withMessage('Invalid game type'),
  
  query('status')
    .optional()
    .isIn(['waiting', 'active', 'finished', 'aborted', 'abandoned'])
    .withMessage('Invalid status'),
  
  query('is_rated')
    .optional()
    .isBoolean()
    .withMessage('Is rated must be a boolean'),
  
  handleValidationErrors
];

/**
 * Validate draw action
 */
const validateDrawAction = [
  validators.uuidParam('gameId'),
  
  body('action')
    .isIn(['accept', 'decline'])
    .withMessage('Action must be accept or decline'),
  
  handleValidationErrors
];

// =============================================================================
// AI GAME VALIDATIONS
// =============================================================================

/**
 * Validate AI game creation
 */
const validateCreateAIGame = [
  body('difficulty')
    .isIn(['beginner', 'easy', 'intermediate', 'hard', 'expert', 'master'])
    .withMessage('Difficulty must be beginner, easy, intermediate, hard, expert, or master'),
  
  body('time_control')
    .optional()
    .matches(/^\d+\+\d+$/)
    .withMessage('Time control must be in format "minutes+increment"'),
  
  body('user_color')
    .optional()
    .isIn(['white', 'black', 'random'])
    .withMessage('User color must be white, black, or random'),
  
  handleValidationErrors
];

/**
 * Validate AI move
 */
const validateAIMove = [
  param('gameId')
    .isUUID()
    .withMessage('Game ID must be a valid UUID'),
  
  body('move')
    .trim()
    .notEmpty()
    .withMessage('Move is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Move must be between 2-10 characters'),
  
  body('time_spent_ms')
    .optional()
    .isInt({ min: 0, max: 3600000 })
    .withMessage('Time spent must be between 0 and 3600000 milliseconds')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validate AI hint request
 */
const validateAIHint = [
  param('gameId')
    .isUUID()
    .withMessage('Game ID must be a valid UUID'),
  
  handleValidationErrors
];

// =============================================================================
// MATCHMAKING VALIDATIONS
// =============================================================================

/**
 * Validate joining matchmaking queue
 */
const validateJoinQueue = [
  body('game_type')
    .isIn(['rapid', 'blitz', 'bullet'])
    .withMessage('Game type must be rapid, blitz, or bullet'),
  
  body('time_control')
    .optional()
    .matches(/^\d+\+\d+$/)
    .withMessage('Time control must be in format "minutes+increment"'),
  
  body('rating_range')
    .optional()
    .isObject()
    .withMessage('Rating range must be an object'),
  
  body('rating_range.min')
    .optional()
    .isInt({ min: 400, max: 3000 })
    .withMessage('Minimum rating must be between 400-3000')
    .toInt(),
  
  body('rating_range.max')
    .optional()
    .isInt({ min: 400, max: 3000 })
    .withMessage('Maximum rating must be between 400-3000')
    .toInt()
    .custom((max, { req }) => {
      if (req.body.rating_range && req.body.rating_range.min && max <= req.body.rating_range.min) {
        throw new Error('Maximum rating must be greater than minimum rating');
      }
      return true;
    }),
  
  handleValidationErrors
];

// =============================================================================
// PUZZLE VALIDATIONS
// =============================================================================

/**
 * Validate puzzle query parameters
 */
const validatePuzzleQuery = [
  query('rating')
    .optional()
    .isInt({ min: 400, max: 3000 })
    .withMessage('Rating must be between 400-3000')
    .toInt(),
  
  query('themes')
    .optional()
    .isString()
    .withMessage('Themes must be a string')
    .custom((themes) => {
      const validThemes = [
        'fork', 'pin', 'skewer', 'discovery', 'deflection', 'decoy',
        'sacrifice', 'mate_in_1', 'mate_in_2', 'mate_in_3', 'endgame',
        'opening', 'middlegame', 'tactics', 'strategy'
      ];
      const themeList = themes.split(',').map(t => t.trim());
      const invalidThemes = themeList.filter(t => !validThemes.includes(t));
      if (invalidThemes.length > 0) {
        throw new Error(`Invalid themes: ${invalidThemes.join(', ')}`);
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validate puzzle attempt submission
 */
const validatePuzzleAttempt = [
  param('puzzleId')
    .isUUID()
    .withMessage('Puzzle ID must be a valid UUID'),
  
  body('moves')
    .isArray({ min: 1, max: 20 })
    .withMessage('Moves must be an array with 1-20 elements'),
  
  body('moves.*')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Each move must be between 2-10 characters'),
  
  body('time_spent_ms')
    .isInt({ min: 0, max: 1800000 }) // Max 30 minutes
    .withMessage('Time spent must be between 0 and 1800000 milliseconds')
    .toInt(),
  
  handleValidationErrors
];

// =============================================================================
// FRIEND VALIDATIONS
// =============================================================================

/**
 * Validate friend request
 */
const validateFriendRequest = [
  body('user_id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Validate friend request response
 */
const validateFriendResponse = [
  param('requestId')
    .isUUID()
    .withMessage('Request ID must be a valid UUID'),
  
  body('action')
    .isIn(['accept', 'decline'])
    .withMessage('Action must be accept or decline'),
  
  handleValidationErrors
];

/**
 * Validate game challenge
 */
const validateGameChallenge = [
  param('friendId')
    .isUUID()
    .withMessage('Friend ID must be a valid UUID'),
  
  body('game_type')
    .isIn(['rapid', 'blitz', 'bullet', 'classical'])
    .withMessage('Game type must be rapid, blitz, bullet, or classical'),
  
  body('time_control')
    .matches(/^\d+\+\d+$/)
    .withMessage('Time control must be in format "minutes+increment"'),
  
  body('color')
    .optional()
    .isIn(['white', 'black', 'random'])
    .withMessage('Color must be white, black, or random'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  
  handleValidationErrors
];

// =============================================================================
// RATING VALIDATIONS
/**
 * Validate rating history query
 */
const validateRatingHistoryQuery = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
  query('rating_type')
    .optional()
    .isIn(['blitz', 'bullet', 'rapid', 'puzzle'])
    .withMessage('Invalid rating type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
    .toInt(),
  handleValidationErrors
];
// =============================================================================

/**
 * Validate leaderboard query
 */
const validateLeaderboardQuery = [
  query('type')
    .optional()
    .isIn(['rapid', 'blitz', 'bullet', 'puzzle'])
    .withMessage('Type must be rapid, blitz, bullet, or puzzle'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1-1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
    .toInt(),
  
  handleValidationErrors
];

// =============================================================================
// OPENING VALIDATIONS
// =============================================================================

/**
 * Validate opening search query
 */
const validateOpeningQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2-100 characters')
    .matches(/^[a-zA-Z0-9\s\-'.,]+$/)
    .withMessage('Search term contains invalid characters'),
  
  query('eco')
    .optional()
    .trim()
    .matches(/^[A-E]\d{2}$/)
    .withMessage('ECO code must be in format A00-E99')
    .toUpperCase(),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1-1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1-50')
    .toInt(),
  
  handleValidationErrors
];

// =============================================================================
// ADMIN VALIDATIONS
// =============================================================================

/**
 * Validate admin query parameters
 */
const validateAdminQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1-1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
    .toInt(),
  
  query('status')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Status must be between 1-50 characters'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2-100 characters'),
  
  handleValidationErrors
];

// =============================================================================
// UTILITY VALIDATIONS
// =============================================================================

/**
 * Validate pagination query parameters
 */
const validatePagination = [
  ...commonValidations.pagination,
  handleValidationErrors
];

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core validation function
  handleValidationErrors,
  
  // Authentication
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
  
  // User management
  validateUpdateProfile,
  validateUserSearch,
  validateUserPreferences,
  validateUserIdParam,
  
  // Game management
  validateCreateGame,
  validateJoinGame,
  validateMakeMove,
  validateGameQuery,
  validateDrawAction,
  
  // AI games
  validateCreateAIGame,
  validateAIMove,
  validateAIHint,
  
  // Matchmaking
  validateJoinQueue,
  validateUpdatePreferences,
  validateOptimalTimesQuery,
  validateCancelMatch,
  validateReportIssue,
  
  // Puzzles
  validatePuzzleQuery,
  validatePuzzleAttempt,
  
  // Friends
  validateFriendRequest,
  validateFriendResponse,
  validateGameChallenge,
  
  // Ratings
  validateLeaderboardQuery,
  validateRatingHistoryQuery,
  
  // Openings
  validateOpeningQuery,
  
  // Admin
  validateAdminQuery,
  
  // Utilities
  validatePagination
};