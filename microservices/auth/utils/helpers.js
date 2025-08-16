// microservices/auth/utils/helpers.js
/**
 * Format standardized API response
 */
function formatResponse(success, data, message, errorCode = null, meta = null) {
  const response = {
    success,
    data,
    message,
    errorCode,
    timestamp: new Date().toISOString()
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 */
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  return password && password.length >= 8;
}

/**
 * Generate random string for tokens
 */
function generateRandomString(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  formatResponse,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  generateRandomString
};
