// utils/logger.js
const config = require('../config');

/**
 * Simple logger utility
 * In production, you might want to use winston, bunyan, or similar
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[config.logging?.level || 'info'] || this.levels.info;
    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
      reset: '\x1b[0m'   // Reset
    };
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    
    let formattedMessage = `[${timestamp}] ${levelUpper}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log with color (development only)
   */
  logWithColor(level, message, meta) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const formattedMessage = this.formatMessage(level, message, meta);
    
    if (isDevelopment && this.colors[level]) {
      console.log(`${this.colors[level]}${formattedMessage}${this.colors.reset}`);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }

  /**
   * Error level logging
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      this.logWithColor('error', message, meta);
      
      // In production, you might want to send errors to external service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
      }
    }
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      this.logWithColor('warn', message, meta);
    }
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      this.logWithColor('info', message, meta);
    }
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      this.logWithColor('debug', message, meta);
    }
  }

  /**
   * Log HTTP requests
   */
  http(method, url, statusCode, responseTime, meta = {}) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    
    this[level](message, meta);
  }

  /**
   * Log database queries (for debugging)
   */
  query(sql, executionTime, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.debug(`DB Query (${executionTime}ms): ${sql}`, meta);
    }
  }

  /**
   * Log game events
   */
  game(event, gameId, meta = {}) {
    this.info(`Game Event: ${event}`, { gameId, ...meta });
  }

  /**
   * Log user actions
   */
  user(action, userId, meta = {}) {
    this.info(`User Action: ${action}`, { userId, ...meta });
  }

  /**
   * Log security events
   */
  security(event, meta = {}) {
    this.warn(`Security Event: ${event}`, meta);
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation} took ${duration}ms`, meta);
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = Object.create(this);
    childLogger.defaultMeta = { ...this.defaultMeta, ...context };
    
    // Override methods to include default meta
    ['error', 'warn', 'info', 'debug'].forEach(level => {
      childLogger[level] = (message, meta = {}) => {
        this[level](message, { ...childLogger.defaultMeta, ...meta });
      };
    });
    
    return childLogger;
  }

  /**
   * Start timer for measuring operation duration
   */
  startTimer(label) {
    const start = Date.now();
    
    return {
      end: (meta = {}) => {
        const duration = Date.now() - start;
        this.performance(label, duration, meta);
        return duration;
      }
    };
  }

  /**
   * Log startup information
   */
  startup() {
    this.info('🚀 Chess App Backend Starting...', {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      port: config.server?.port || 5000,
      logLevel: config.logging?.level || 'info'
    });
  }

  /**
   * Log shutdown information
   */
  shutdown() {
    this.info('🛑 Chess App Backend Shutting Down...', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log middleware execution
   */
  middleware(name, duration, meta = {}) {
    this.debug(`Middleware: ${name} (${duration}ms)`, meta);
  }

  /**
   * Log validation errors
   */
  validation(errors, meta = {}) {
    this.warn('Validation failed', { errors, ...meta });
  }

  /**
   * Log external API calls
   */
  external(service, method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? 'error' : 'info';
    this[level](`External API: ${service} ${method} ${url} ${statusCode} (${duration}ms)`, meta);
  }

  /**
   * Log memory usage
   */
  memory() {
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;
    
    this.debug('Memory Usage', {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external)
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Log startup message
if (process.env.NODE_ENV !== 'test') {
  logger.startup();
}

// Handle process shutdown
process.on('SIGTERM', () => {
  logger.shutdown();
});

process.on('SIGINT', () => {
  logger.shutdown();
});

module.exports = logger;