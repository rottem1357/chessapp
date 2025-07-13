/**
 * Helper Utilities
 * 
 * This module provides various utility functions used throughout
 * the chess application for common operations and formatting.
 */

import { TIME_CONSTANTS, PIECE_COLORS, PLAYER_COLORS } from './constants';

/**
 * Format time duration in a human-readable format
 * @param {number} milliseconds - Time duration in milliseconds
 * @returns {string} Formatted time string
 */
export const formatDuration = (milliseconds) => {
  if (milliseconds < TIME_CONSTANTS.MINUTE) {
    return `${Math.floor(milliseconds / TIME_CONSTANTS.SECOND)}s`;
  }
  
  if (milliseconds < TIME_CONSTANTS.HOUR) {
    const minutes = Math.floor(milliseconds / TIME_CONSTANTS.MINUTE);
    const seconds = Math.floor((milliseconds % TIME_CONSTANTS.MINUTE) / TIME_CONSTANTS.SECOND);
    return `${minutes}m ${seconds}s`;
  }
  
  if (milliseconds < TIME_CONSTANTS.DAY) {
    const hours = Math.floor(milliseconds / TIME_CONSTANTS.HOUR);
    const minutes = Math.floor((milliseconds % TIME_CONSTANTS.HOUR) / TIME_CONSTANTS.MINUTE);
    return `${hours}h ${minutes}m`;
  }
  
  const days = Math.floor(milliseconds / TIME_CONSTANTS.DAY);
  const hours = Math.floor((milliseconds % TIME_CONSTANTS.DAY) / TIME_CONSTANTS.HOUR);
  return `${days}d ${hours}h`;
};

/**
 * Format timestamp to readable date string
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Get relative time string (e.g., "2 minutes ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < TIME_CONSTANTS.MINUTE) {
    return 'Just now';
  }
  
  if (diff < TIME_CONSTANTS.HOUR) {
    const minutes = Math.floor(diff / TIME_CONSTANTS.MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  if (diff < TIME_CONSTANTS.DAY) {
    const hours = Math.floor(diff / TIME_CONSTANTS.HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (diff < TIME_CONSTANTS.WEEK) {
    const days = Math.floor(diff / TIME_CONSTANTS.DAY);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  return formatTimestamp(timestamp);
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func.apply(null, args);
  };
};

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export const deepClone = (obj) => {
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
};

/**
 * Check if two objects are deeply equal
 * @param {*} obj1 - First object
 * @param {*} obj2 - Second object
 * @returns {boolean} Whether objects are equal
 */
export const isDeepEqual = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true;
  }
  
  if (obj1 == null || obj2 == null) {
    return false;
  }
  
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  
  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }
    
    if (!isDeepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Convert chess.js color to player color
 * @param {string} chessColor - Chess.js color ('w' or 'b')
 * @returns {string} Player color ('white' or 'black')
 */
export const chessColorToPlayerColor = (chessColor) => {
  return chessColor === PIECE_COLORS.WHITE ? PLAYER_COLORS.WHITE : PLAYER_COLORS.BLACK;
};

/**
 * Convert player color to chess.js color
 * @param {string} playerColor - Player color ('white' or 'black')
 * @returns {string} Chess.js color ('w' or 'b')
 */
export const playerColorToChessColor = (playerColor) => {
  return playerColor === PLAYER_COLORS.WHITE ? PIECE_COLORS.WHITE : PIECE_COLORS.BLACK;
};

/**
 * Get opposite color
 * @param {string} color - Current color
 * @returns {string} Opposite color
 */
export const getOppositeColor = (color) => {
  if (color === PLAYER_COLORS.WHITE || color === PIECE_COLORS.WHITE) {
    return color === PLAYER_COLORS.WHITE ? PLAYER_COLORS.BLACK : PIECE_COLORS.BLACK;
  }
  return color === PLAYER_COLORS.BLACK ? PLAYER_COLORS.WHITE : PIECE_COLORS.WHITE;
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format player rating
 * @param {number} rating - Player rating
 * @returns {string} Formatted rating
 */
export const formatRating = (rating) => {
  if (typeof rating !== 'number') {
    return '—';
  }
  return rating.toLocaleString();
};

/**
 * Get chess piece unicode symbol
 * @param {string} piece - Piece character (e.g., 'K', 'q', 'r')
 * @returns {string} Unicode symbol
 */
export const getPieceSymbol = (piece) => {
  const symbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  return symbols[piece] || piece;
};

/**
 * Convert move to algebraic notation
 * @param {Object} move - Move object from chess.js
 * @returns {string} Algebraic notation
 */
export const moveToAlgebraic = (move) => {
  if (!move || !move.san) {
    return '';
  }
  return move.san;
};

/**
 * Format move for display
 * @param {Object} move - Move object
 * @param {number} moveNumber - Move number
 * @param {string} color - Player color
 * @returns {string} Formatted move
 */
export const formatMove = (move, moveNumber, color) => {
  const algebraic = moveToAlgebraic(move);
  if (color === PLAYER_COLORS.WHITE) {
    return `${moveNumber}. ${algebraic}`;
  }
  return `${moveNumber}... ${algebraic}`;
};

/**
 * Check if device is mobile
 * @returns {boolean} Whether device is mobile
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * Check if device is tablet
 * @returns {boolean} Whether device is tablet
 */
export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

/**
 * Check if device is desktop
 * @returns {boolean} Whether device is desktop
 */
export const isDesktop = () => {
  return window.innerWidth > 1024;
};

/**
 * Get optimal board size for current screen
 * @returns {number} Board size in pixels
 */
export const getOptimalBoardSize = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  if (isMobile()) {
    return Math.min(screenWidth - 40, screenHeight - 200);
  }
  
  if (isTablet()) {
    return Math.min(screenWidth * 0.6, screenHeight * 0.7);
  }
  
  return Math.min(600, screenWidth * 0.4);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether copy was successful
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
};

/**
 * Generate share URL for game
 * @param {string} gameId - Game ID
 * @returns {string} Share URL
 */
export const generateShareUrl = (gameId) => {
  return `${window.location.origin}/game/${gameId}`;
};

/**
 * Parse URL parameters
 * @param {string} url - URL to parse (optional, defaults to current URL)
 * @returns {Object} URL parameters
 */
export const parseUrlParams = (url = window.location.href) => {
  const params = new URLSearchParams(new URL(url).search);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * Build URL with parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Parameters to add
 * @returns {string} Complete URL
 */
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

/**
 * Sleep for specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay between retries
 * @returns {Promise} Promise that resolves when function succeeds
 */
export const retry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Create a loading state object
 * @param {boolean} isLoading - Whether currently loading
 * @param {*} data - Data value
 * @param {string} error - Error message
 * @returns {Object} Loading state object
 */
export const createLoadingState = (isLoading = false, data = null, error = null) => ({
  isLoading,
  data,
  error,
  isSuccess: !isLoading && !error && data !== null,
  isError: !isLoading && error !== null,
});

const helpers = {
  formatDuration,
  formatTimestamp,
  getRelativeTime,
  debounce,
  throttle,
  generateId,
  deepClone,
  isDeepEqual,
  chessColorToPlayerColor,
  playerColorToChessColor,
  getOppositeColor,
  capitalize,
  formatRating,
  getPieceSymbol,
  moveToAlgebraic,
  formatMove,
  isMobile,
  isTablet,
  isDesktop,
  getOptimalBoardSize,
  copyToClipboard,
  generateShareUrl,
  parseUrlParams,
  buildUrl,
  sleep,
  retry,
  createLoadingState,
};

export default helpers;
