// microservices/gateway/utils/logger.js
const winston = require('winston');
const appConfig = require('../config');

const logger = winston.createLogger({
  level: appConfig.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    appConfig.logging.format === 'json' 
      ? winston.format.json()
      : winston.format.simple()
  ),
  defaultMeta: { service: 'gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file logging in production
if (appConfig.server.environment === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

module.exports = logger;