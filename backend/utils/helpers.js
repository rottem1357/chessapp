// utils/helpers.js
const { v4: uuidv4 } = require('uuid');

/**
 * Format success response
 */
function formatSuccessResponse(data, message = 'Success', meta = {}) {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format error response
 */
function formatErrorResponse(message, code = 'ERROR', details = null) {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
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
 * Convert chess piece notation
 */
function convertPieceNotation(piece, format = 'symbol') {
  const pieceMap = {
    'p': { name: 'pawn', symbol: '♟', unicode: '\u265F' },
    'r': { name: 'rook', symbol: '♜', unicode: '\u265C' },
    'n': { name: 'knight', symbol: '♞', unicode: '\u265E' },
    'b': { name: 'bishop', symbol: '♝', unicode: '\u265D' },
    'q': { name: 'queen', symbol: '♛', unicode: '\u265B' },
    'k': { name: 'king', symbol: '♚', unicode: '\u265A' }
  };
  
  if (!piece || !pieceMap[piece.toLowerCase()]) {
    return null;
  }
  
  const pieceInfo = pieceMap[piece.toLowerCase()];
  return pieceInfo[format] || piece;
}

/**
 * Calculate ELO rating change
 */
function calculateEloChange(playerRating, opponentRating, score, kFactor = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(kFactor * (score - expectedScore));
}

/**
 * Get K-factor for ELO calculation based on rating and games played
 */
function getKFactor(rating, gamesPlayed) {
  if (gamesPlayed < 30) return 40;
  if (rating < 2100) return 32;
  if (rating < 2400) return 24;
  return 16;
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Convert milliseconds to readable time format
 */
function msToTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get user's display name (fallback to username)
 */
function getUserDisplayName(user) {
  if (!user) return 'Unknown';
  return user.display_name || user.username || 'Anonymous';
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate slug from string
 */
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if string contains only alphanumeric characters
 */
function isAlphanumeric(str) {
  if (!str) return false;
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Truncate string with ellipsis
 */
function truncateString(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convert object to query string
 */
function objectToQueryString(obj) {
  if (!obj || typeof obj !== 'object') return '';
  
  const params = new URLSearchParams();
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      params.append(key, obj[key]);
    }
  });
  
  return params.toString();
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get random element from array
 */
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array using Fisher-Yates algorithm
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
 */
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
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
  convertPieceNotation,
  calculateEloChange,
  getKFactor,
  isValidUUID,
  msToTime,
  getUserDisplayName,
  escapeHtml,
  generateSlug,
  isAlphanumeric,
  truncateString,
  objectToQueryString,
  isEmpty,
  getRandomElement,
  shuffleArray,
  groupBy,
  sleep
};