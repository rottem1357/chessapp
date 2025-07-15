// middleware/optionalAuth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware for optional authentication
 * Adds user info to request if valid token is provided, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        // Token is invalid, but we don't error out - just continue without auth
        logger.debug('Optional auth token verification failed', { 
          error: err.message,
          ip: req.ip
        });
        req.user = null;
      } else {
        // Token is valid, attach user info to request
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          is_admin: decoded.is_admin || false
        };

        logger.debug('Optional auth successful', { 
          userId: decoded.id,
          username: decoded.username
        });
      }

      next();
    });
  } catch (error) {
    logger.error('Error in optional auth middleware', { 
      error: error.message,
      ip: req.ip
    });

    // On error, continue without authentication
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;