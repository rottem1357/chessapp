// middleware/requestLogger.js
const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log completed request
    logger.http(req.method, req.url, res.statusCode, responseTime, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentLength: res.get('Content-Length')
    });
    
    // Call original end method
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };