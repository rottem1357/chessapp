/**
 * Error Handling Middleware
 * Centralized error handling for the chess application
 */

const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default error response
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR || 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation error';
    details = isDevelopment ? err.message : null;
  } else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
    details = isDevelopment ? err.message : null;
  } else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate entry';
    details = isDevelopment ? err.message : null;
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json(formatErrorResponse(message, details));
}

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(
    formatErrorResponse('Route not found')
  );
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
