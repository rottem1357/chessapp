/**
 * Utility Functions
 * Common utility functions for the chess application
 */

const { v4: uuidv4 } = require('uuid');
const { VALIDATION } = require('./constants');

/**
 * Generate a unique game ID
 * @returns {string} UUID v4 string
 */
function generateGameId() {
  return uuidv4();
}

/**
 * Generate a unique player ID
 * @returns {string} UUID v4 string
 */
function generatePlayerId() {
  return uuidv4();
}

/**
 * Generate a unique message ID
 * @returns {string} UUID v4 string
 */
function generateMessageId() {
  return uuidv4();
}

/**
 * Validate if a string is a valid UUID
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(id) {
  return typeof id === 'string' && VALIDATION.GAME_ID_PATTERN.test(id);
}

/**
 * Validate if a move is in valid UCI format
 * @param {string} move - The move to validate
 * @returns {boolean} True if valid UCI move
 */
function isValidUCIMove(move) {
  return typeof move === 'string' && VALIDATION.UCI_MOVE_PATTERN.test(move);
}

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {boolean} True if valid
 */
function isValidPlayerName(name) {
  return typeof name === 'string' && 
         name.length >= VALIDATION.MIN_PLAYER_NAME_LENGTH &&
         name.length <= VALIDATION.MAX_PLAYER_NAME_LENGTH &&
         name.trim().length > 0;
}

/**
 * Validate chat message
 * @param {string} message - Message to validate
 * @returns {boolean} True if valid
 */
function isValidChatMessage(message) {
  return typeof message === 'string' &&
         message.length <= VALIDATION.MAX_CHAT_MESSAGE_LENGTH &&
         message.trim().length > 0;
}

/**
 * Sanitize player name
 * @param {string} name - Player name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, VALIDATION.MAX_PLAYER_NAME_LENGTH);
}

/**
 * Sanitize chat message
 * @param {string} message - Message to sanitize
 * @returns {string} Sanitized message
 */
function sanitizeChatMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }
  
  return message
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, VALIDATION.MAX_CHAT_MESSAGE_LENGTH);
}

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} code - Error code (optional)
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(message, code = null) {
  return {
    success: false,
    message,
    ...(code && { code })
  };
}

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message (optional)
 * @returns {Object} Formatted success response
 */
function formatSuccessResponse(data, message = null) {
  return {
    success: true,
    ...(message && { message }),
    ...(data && { data })
  };
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Shuffle an array in place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
function truncateString(str, length, suffix = '...') {
  if (!str || str.length <= length) {
    return str;
  }
  
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

module.exports = {
  generateGameId,
  generatePlayerId,
  generateMessageId,
  isValidUUID,
  isValidUCIMove,
  isValidPlayerName,
  isValidChatMessage,
  sanitizePlayerName,
  sanitizeChatMessage,
  getCurrentTimestamp,
  formatErrorResponse,
  formatSuccessResponse,
  deepClone,
  sleep,
  randomInt,
  randomFloat,
  shuffleArray,
  truncateString,
  isEmpty
};
