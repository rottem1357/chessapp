/**
 * Validation Utilities
 * 
 * This module provides validation functions for user inputs,
 * game states, and data integrity checks.
 */

import { VALIDATION_RULES, PLAYER_COLORS, AI_DIFFICULTIES } from './constants';

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string} error - Error message if validation failed
 * @property {*} value - Cleaned/processed value if validation passed
 */

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {ValidationResult} Validation result
 */
export const validatePlayerName = (name) => {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Player name is required',
      value: null,
    };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.PLAYER_NAME.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Player name must be at least ${VALIDATION_RULES.PLAYER_NAME.MIN_LENGTH} characters long`,
      value: null,
    };
  }
  
  if (trimmedName.length > VALIDATION_RULES.PLAYER_NAME.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Player name must be no more than ${VALIDATION_RULES.PLAYER_NAME.MAX_LENGTH} characters long`,
      value: null,
    };
  }
  
  if (!VALIDATION_RULES.PLAYER_NAME.PATTERN.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Player name can only contain letters, numbers, underscores, and spaces',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: trimmedName,
  };
};

/**
 * Validate chat message
 * @param {string} message - Chat message to validate
 * @returns {ValidationResult} Validation result
 */
export const validateChatMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'Message is required',
      value: null,
    };
  }
  
  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length < VALIDATION_RULES.CHAT_MESSAGE.MIN_LENGTH) {
    return {
      isValid: false,
      error: 'Message cannot be empty',
      value: null,
    };
  }
  
  if (trimmedMessage.length > VALIDATION_RULES.CHAT_MESSAGE.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Message must be no more than ${VALIDATION_RULES.CHAT_MESSAGE.MAX_LENGTH} characters long`,
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: trimmedMessage,
  };
};

/**
 * Validate game ID
 * @param {string} gameId - Game ID to validate
 * @returns {ValidationResult} Validation result
 */
export const validateGameId = (gameId) => {
  if (!gameId || typeof gameId !== 'string') {
    return {
      isValid: false,
      error: 'Game ID is required',
      value: null,
    };
  }
  
  const trimmedId = gameId.trim();
  
  if (!VALIDATION_RULES.GAME_ID.PATTERN.test(trimmedId)) {
    return {
      isValid: false,
      error: 'Invalid game ID format',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: trimmedId,
  };
};

/**
 * Validate player color
 * @param {string} color - Player color to validate
 * @returns {ValidationResult} Validation result
 */
export const validatePlayerColor = (color) => {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Player color is required',
      value: null,
    };
  }
  
  const validColors = Object.values(PLAYER_COLORS);
  const lowerColor = color.toLowerCase();
  
  if (!validColors.includes(lowerColor)) {
    return {
      isValid: false,
      error: `Player color must be one of: ${validColors.join(', ')}`,
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: lowerColor,
  };
};

/**
 * Validate AI difficulty
 * @param {string} difficulty - AI difficulty to validate
 * @returns {ValidationResult} Validation result
 */
export const validateAIDifficulty = (difficulty) => {
  if (!difficulty || typeof difficulty !== 'string') {
    return {
      isValid: false,
      error: 'AI difficulty is required',
      value: null,
    };
  }
  
  const validDifficulties = Object.values(AI_DIFFICULTIES);
  const lowerDifficulty = difficulty.toLowerCase();
  
  if (!validDifficulties.includes(lowerDifficulty)) {
    return {
      isValid: false,
      error: `AI difficulty must be one of: ${validDifficulties.join(', ')}`,
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: lowerDifficulty,
  };
};

/**
 * Validate chess move
 * @param {Object} move - Move object to validate
 * @param {string} move.from - Source square
 * @param {string} move.to - Target square
 * @param {string} move.promotion - Promotion piece (optional)
 * @returns {ValidationResult} Validation result
 */
export const validateChessMove = (move) => {
  if (!move || typeof move !== 'object') {
    return {
      isValid: false,
      error: 'Move object is required',
      value: null,
    };
  }
  
  const { from, to, promotion } = move;
  
  // Validate source square
  if (!from || typeof from !== 'string' || !isValidSquare(from)) {
    return {
      isValid: false,
      error: 'Invalid source square',
      value: null,
    };
  }
  
  // Validate target square
  if (!to || typeof to !== 'string' || !isValidSquare(to)) {
    return {
      isValid: false,
      error: 'Invalid target square',
      value: null,
    };
  }
  
  // Validate promotion piece if provided
  if (promotion && (!typeof promotion === 'string' || !isValidPromotionPiece(promotion))) {
    return {
      isValid: false,
      error: 'Invalid promotion piece',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      promotion: promotion ? promotion.toLowerCase() : undefined,
    },
  };
};

/**
 * Validate FEN string
 * @param {string} fen - FEN string to validate
 * @returns {ValidationResult} Validation result
 */
export const validateFEN = (fen) => {
  if (!fen || typeof fen !== 'string') {
    return {
      isValid: false,
      error: 'FEN string is required',
      value: null,
    };
  }
  
  const fenParts = fen.trim().split(' ');
  
  if (fenParts.length !== 6) {
    return {
      isValid: false,
      error: 'FEN string must have 6 parts',
      value: null,
    };
  }
  
  // Basic FEN validation (more comprehensive validation would require chess.js)
  const [boardPart, activeColor, castling, enPassant, halfMove, fullMove] = fenParts;
  
  // Validate board part
  const ranks = boardPart.split('/');
  if (ranks.length !== 8) {
    return {
      isValid: false,
      error: 'Board must have 8 ranks',
      value: null,
    };
  }
  
  // Validate active color
  if (!['w', 'b'].includes(activeColor)) {
    return {
      isValid: false,
      error: 'Active color must be w or b',
      value: null,
    };
  }
  
  // Validate move numbers
  if (isNaN(parseInt(halfMove)) || isNaN(parseInt(fullMove))) {
    return {
      isValid: false,
      error: 'Move numbers must be valid integers',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: fen.trim(),
  };
};

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {ValidationResult} Validation result
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
      value: null,
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: trimmedEmail,
  };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {ValidationResult} Validation result
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required',
      value: null,
    };
  }
  
  if (password.length < 6) {
    return {
      isValid: false,
      error: 'Password must be at least 6 characters long',
      value: null,
    };
  }
  
  if (password.length > 100) {
    return {
      isValid: false,
      error: 'Password must be no more than 100 characters long',
      value: null,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: password,
  };
};

/**
 * Check if a square is valid (a1-h8)
 * @param {string} square - Square to validate
 * @returns {boolean} Whether the square is valid
 */
const isValidSquare = (square) => {
  const squareRegex = /^[a-h][1-8]$/;
  return squareRegex.test(square.toLowerCase());
};

/**
 * Check if a promotion piece is valid
 * @param {string} piece - Piece to validate
 * @returns {boolean} Whether the piece is valid
 */
const isValidPromotionPiece = (piece) => {
  const validPieces = ['q', 'r', 'b', 'n'];
  return validPieces.includes(piece.toLowerCase());
};

/**
 * Validate form data using multiple validators
 * @param {Object} data - Form data to validate
 * @param {Object} validators - Optional validator functions for each field
 * @returns {Object} Validation results
 */
export const validateForm = (data, validators = null) => {
  // Safety check for data parameter
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: 'Invalid form data provided' },
      values: {},
      results: {},
    };
  }
  
  // If no validators provided, use default validators based on field names
  if (!validators) {
    validators = {};
    
    // Auto-detect validators based on field names
    if (data.hasOwnProperty('playerName')) {
      validators.playerName = validatePlayerName;
    }
    
    if (data.hasOwnProperty('gameMode')) {
      validators.gameMode = (value) => {
        if (!value || typeof value !== 'string') {
          return { isValid: false, error: 'Please select a game mode', value: null };
        }
        const validModes = ['local', 'ai', 'multiplayer'];
        if (!validModes.includes(value)) {
          return { isValid: false, error: 'Invalid game mode selected', value: null };
        }
        return { isValid: true, error: null, value };
      };
    }
    
    if (data.hasOwnProperty('aiDifficulty')) {
      validators.aiDifficulty = (value) => {
        if (!value || typeof value !== 'string') {
          return { isValid: false, error: 'Please select AI difficulty', value: null };
        }
        const validDifficulties = Object.values(AI_DIFFICULTIES);
        if (!validDifficulties.includes(value)) {
          return { isValid: false, error: 'Invalid AI difficulty selected', value: null };
        }
        return { isValid: true, error: null, value };
      };
    }
  }
  
  const results = {};
  let isValid = true;
  const errors = {};
  const values = {};
  
  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(data[field]);
    results[field] = result;
    
    if (!result.isValid) {
      isValid = false;
      errors[field] = result.error;
    } else {
      values[field] = result.value;
    }
  }
  
  return {
    isValid,
    errors,
    values,
    results,
  };
};

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeHTML = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate and sanitize user input
 * @param {string} input - User input to validate and sanitize
 * @param {Function} validator - Validation function
 * @returns {ValidationResult} Validation result with sanitized value
 */
export const validateAndSanitize = (input, validator) => {
  const result = validator(input);
  
  if (result.isValid && typeof result.value === 'string') {
    result.value = sanitizeHTML(result.value);
  }
  
  return result;
};

// Alias for chat message validation
export const validateMessage = validateChatMessage;

const validation = {
  validatePlayerName,
  validateChatMessage,
  validateMessage,
  validateGameId,
  validatePlayerColor,
  validateAIDifficulty,
  validateChessMove,
  validateFEN,
  validateEmail,
  validatePassword,
  validateForm,
  sanitizeHTML,
  validateAndSanitize,
};

export default validation;
