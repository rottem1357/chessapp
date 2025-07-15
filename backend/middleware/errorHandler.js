// middleware/errorHandler.js
const { HTTP_STATUS } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Default error response
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation error';
    errorCode = 'VALIDATION_001';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Database validation error';
    errorCode = 'VALIDATION_001';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Resource already exists';
    errorCode = 'CONFLICT_ERROR';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid reference';
    errorCode = 'FOREIGN_KEY_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
    errorCode = 'AUTH_001';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
    errorCode = 'AUTH_002';
  } else if (err.statusCode) {
    // Custom error with status code
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code || 'CUSTOM_ERROR';
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorDetails = isDevelopment ? {
    stack: err.stack,
    details: err
  } : undefined;

  res.status(statusCode).json(
    formatErrorResponse(message, errorCode, errorDetails)
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(
    formatErrorResponse(
      `Route ${req.method} ${req.path} not found`,
      'ROUTE_NOT_FOUND'
    )
  );
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    formatErrorResponse(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_001'
    )
  );
};

/**
 * Request timeout handler
 */
const timeoutHandler = (req, res) => {
  logger.warn('Request timeout', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(HTTP_STATUS.REQUEST_TIMEOUT).json(
    formatErrorResponse(
      'Request timeout. Please try again.',
      'TIMEOUT_ERROR'
    )
  );
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  rateLimitHandler,
  timeoutHandler
};