// microservices/gateway/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Gateway error', {
    traceId: req.traceId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Service timeout';
    errorCode = 'SERVICE_TIMEOUT';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    traceId: req.traceId,
    timestamp: new Date().toISOString()
  });
};

const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    traceId: req.traceId,
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    errorCode: 'NOT_FOUND',
    traceId: req.traceId,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler, notFoundHandler };