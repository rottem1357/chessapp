// microservices/auth/middleware/errorHandler.js
const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Auth service error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    traceId: req.traceId
  });

  // Default error response
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Resource already exists';
    errorCode = 'CONSTRAINT_VIOLATION';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid reference';
    errorCode = 'FOREIGN_KEY_VIOLATION';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = 'Database connection failed';
    errorCode = 'DATABASE_UNAVAILABLE';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  res.status(statusCode).json(
    formatResponse(false, null, message, errorCode)
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    traceId: req.traceId
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(
    formatResponse(false, null, 'Endpoint not found', 'NOT_FOUND')
  );
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler
};
