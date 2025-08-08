// utils/helpers.js
const { v4: uuidv4 } = require('uuid');

/**
 * Unified response formatter
 */
function formatResponse(success, data = null, message = '', errorCode = null, meta = null) {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  if (!success && errorCode) {
    response.errorCode = errorCode;
  }

  if (meta) {
    response.meta = meta;
  }

  if (process.env.NODE_ENV === 'development' && !success && data?.stack) {
    response.debug = { stack: data.stack };
    delete response.data;
  }

  return response;
}

/**
 * Validate required fields
 */
function validateRequired(data, requiredFields) {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      missingFields.push(field);
    }
  });
  
  return missingFields;
}

/**
 * Sanitize player name
 */
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }
  
  // Remove special characters, keep only alphanumeric, spaces, dashes, underscores
  const sanitized = name.trim()
    .replace(/[^\w\s\-_.]/g, '')
    .substring(0, 50);
  
  return sanitized || null;
}

/**
 * Sanitize chat message
 */
function sanitizeChatMessage(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }
  
  const sanitized = message.trim().substring(0, 500);
  
  // Basic profanity filter (extend as needed)
  const profanityWords = ['spam', 'bot', 'cheat']; // Add more as needed
  let filtered = sanitized;
  
  profanityWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  
  return filtered || null;
}

/**
 * Generate unique game ID
 */
function generateGameId() {
  return uuidv4();
}

/**
 * Generate unique player ID
 */
function generatePlayerId() {
  return uuidv4();
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Format time duration
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate time remaining
 */
function calculateTimeRemaining(startTime, timeLimit) {
  const elapsed = Date.now() - startTime;
  return Math.max(0, timeLimit - elapsed);
}

/**
 * Parse time control string (e.g., "10+5" -> {minutes: 10, increment: 5})
 */
function parseTimeControl(timeControl) {
  if (!timeControl || typeof timeControl !== 'string') {
    return { minutes: 10, increment: 0 };
  }
  
  const parts = timeControl.split('+');
  const minutes = parseInt(parts[0]) || 10;
  const increment = parseInt(parts[1]) || 0;
  
  return { minutes, increment };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate chess square notation (e.g., "e4", "a1")
 */
function isValidSquare(square) {
  if (!square || typeof square !== 'string') {
    return false;
  }
  
  const squareRegex = /^[a-h][1-8]$/;
  return squareRegex.test(square);
}

/**
 * Validate chess move notation (basic validation)
 */
function isValidMoveNotation(move) {
  if (!move || typeof move !== 'string') {
    return false;
  }
  
  // Basic SAN (Standard Algebraic Notation) validation
  const moveRegex = /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](\=[NBRQ])?[\+#]?$|^O-O(-O)?[\+#]?$/;
  return moveRegex.test(move);
}

/**
 * Generate random string
 */
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Deep clone object
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
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Remove sensitive information from user object
 */
function sanitizeUserData(user) {
  if (!user) return null;
  
  const sensitiveFields = ['password_hash', 'reset_token', 'verification_token'];
  const sanitized = { ...user };
  
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });
  
  return sanitized;
}

/**
 * Calculate pagination info
 */
function calculatePagination(page, limit, total) {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(total / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  
  return {
    page: currentPage,
    limit: itemsPerPage,
    total,
    pages: totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate ELO rating change
 * @param {number} playerRating - Current player rating
 * @param {number} opponentRating - Opponent rating
 * @param {number} score - Game result (1 = win, 0.5 = draw, 0 = loss)
 * @param {number} kFactor - K-factor for rating calculation
 * @returns {number} Rating change
 */
function calculateEloChange(playerRating, opponentRating, score, kFactor = null) {
  if (!kFactor) {
    kFactor = getKFactor(playerRating);
  }
  
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const ratingChange = Math.round(kFactor * (score - expectedScore));
  
  return ratingChange;
}

/**
 * Get K-factor based on player rating
 * @param {number} rating - Player rating
 * @returns {number} K-factor
 */
function getKFactor(rating) {
  if (rating < 1400) return 40;
  if (rating < 2100) return 20;
  return 10;
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Convert milliseconds to time format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time
 */
function msToTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get user display name
 * @param {Object} user - User object
 * @returns {string} Display name
 */
function getUserDisplayName(user) {
  return user.display_name || user.username || 'Anonymous';
}

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Check if string is alphanumeric
 * @param {string} str - String to check
 * @returns {boolean} True if alphanumeric
 */
function isAlphanumeric(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if value is empty
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

module.exports = {
  formatResponse,
  validateRequired,
  sanitizePlayerName,
  sanitizeChatMessage,
  generateGameId,
  generatePlayerId,
  getCurrentTimestamp,
  formatDuration,
  calculateTimeRemaining,
  parseTimeControl,
  isValidEmail,
  isValidSquare,
  isValidMoveNotation,
  generateRandomString,
  deepClone,
  sanitizeUserData,
  calculatePagination,
  calculateEloChange,
  getKFactor,
  isValidUUID,
  msToTime,
  getUserDisplayName,
  escapeHtml,
  isAlphanumeric,
  isEmpty,
  shuffleArray,
  groupBy,
  sleep
};