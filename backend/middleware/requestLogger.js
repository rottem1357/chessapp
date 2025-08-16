// middleware/requestLogger.js
const logger = require('../utils/logger');
const telemetry = require('../telemetry');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const endMetric = telemetry.httpRequestDuration.startTimer();
  
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

    endMetric({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      code: res.statusCode,
    });

    // Call original end method
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };
