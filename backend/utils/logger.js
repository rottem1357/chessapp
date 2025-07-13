/**
 * Logging Utility
 * Provides structured logging for the chess application
 */

const config = require('../config');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[config.logging.level] || this.levels.info;
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      this.log('ERROR', message, meta);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      this.log('WARN', message, meta);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      this.log('INFO', message, meta);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      this.log('DEBUG', message, meta);
    }
  }

  /**
   * Internal log method
   * @param {string} level - Log level
   * @param {string} message - Message
   * @param {Object} meta - Metadata
   */
  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // In production, you might want to use a proper logging library
    // like winston or pino for better performance and features
    console.log(JSON.stringify(logEntry, null, 2));
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
