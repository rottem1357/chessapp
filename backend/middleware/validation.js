/**
 * Validate registration data
 */
function validateRegister(req, res, next) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Username, email, and password are required')
    );
  }
  // Basic email format check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Invalid email format')
    );
  }
  next();
}

/**
 * Validate login data
 */
function validateLogin(req, res, next) {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Username or email and password are required')
    );
  }
  next();
}

/**
 * Validate password reset request data
 */
function validatePasswordResetRequest(req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Email is required')
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Invalid email format')
    );
  }
  next();
}

/**
 * Validate password reset confirmation data
 */
function validatePasswordResetConfirm(req, res, next) {
  const { reset_token, new_password } = req.body;
  if (!reset_token || !new_password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Reset token and new password are required')
    );
  }
  next();
}
/**
 * Validation Middleware
 * Input validation middleware for the chess application
 */

const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const { 
  isValidUUID, 
  isValidPlayerName, 
  isValidChatMessage,
  formatErrorResponse 
} = require('../utils/helpers');

/**
 * Validate game ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateGameId(req, res, next) {
  const { gameId } = req.params;
  
  if (!gameId || !isValidUUID(gameId)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Invalid game ID')
    );
  }
  
  next();
}

/**
 * Validate player data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validatePlayerData(req, res, next) {
  const { name } = req.body;
  
  if (name && !isValidPlayerName(name)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse(ERROR_MESSAGES.INVALID_PLAYER_NAME)
    );
  }
  
  next();
}

/**
 * Validate chat message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateChatMessage(req, res, next) {
  const { message } = req.body;
  
  if (!message || !isValidChatMessage(message)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse(ERROR_MESSAGES.CHAT_MESSAGE_TOO_LONG)
    );
  }
  
  next();
}

/**
 * Validate move data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateMoveData(req, res, next) {
  const { move } = req.body;
  
  if (!move) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Move is required')
    );
  }
  
  // Basic move validation - the chess library will do more detailed validation
  if (typeof move !== 'string' && typeof move !== 'object') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse(ERROR_MESSAGES.INVALID_MOVE)
    );
  }
  
  next();
}

/**
 * Validate AI game creation data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateAIGameData(req, res, next) {
  const { difficulty, playerColor } = req.body;
  
  // Validate difficulty
  if (difficulty) {
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.INVALID_DIFFICULTY)
      );
    }
  }
  
  // Validate player color
  if (playerColor) {
    const validColors = ['white', 'black'];
    if (!validColors.includes(playerColor)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Invalid player color')
      );
    }
  }
  
  next();
}

/**
 * Validate request body exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateRequestBody(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse('Request body is required')
    );
  }
  
  next();
}

/**
 * Validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validatePagination(req, res, next) {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Page must be a positive integer')
      );
    }
    req.query.page = pageNum;
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Limit must be between 1 and 100')
      );
    }
    req.query.limit = limitNum;
  }
  
  next();
}

/**
 * Validate Authorization Token
 * Checks for presence and format of Bearer token in Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatErrorResponse('Authorization token missing or invalid format')
    );
  }
  next();
}

module.exports = {
  validateGameId,
  validatePlayerData,
  validateChatMessage,
  validateMoveData,
  validateAIGameData,
  validateRequestBody,
  validatePagination,
  validateAuthToken,
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordResetConfirm
};
