/**
 * Request Logging Middleware
 * Logs incoming requests for debugging and monitoring
 */

const logger = require('../utils/logger');

/**
 * Log incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request details
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

module.exports = {
  requestLogger
};
