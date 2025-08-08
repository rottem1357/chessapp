// middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token and authenticate user
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Access token is required', 'AUTH_001')
      );
    }

    // Check if token format is correct (Bearer token)
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Invalid token format. Use Bearer token', 'AUTH_001')
      );
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Access token is required', 'AUTH_001')
      );
    }

    // Verify token
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed', { 
          error: err.message,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        if (err.name === 'TokenExpiredError') {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            formatResponse(false, null, 'Token has expired', 'AUTH_002')
          );
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            formatResponse(false, null, 'Invalid token', 'AUTH_001')
          );
        } else {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            formatResponse(false, null, 'Token verification failed', 'AUTH_001')
          );
        }
      }

      // Token is valid, attach user info to request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        is_admin: decoded.is_admin || false
      };

      logger.debug('Token verified successfully', { 
        userId: decoded.id,
        username: decoded.username
      });

      next();
    });
  } catch (error) {
    logger.error('Error in token verification middleware', { 
      error: error.message,
      ip: req.ip
    });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, 'Authentication error', 'AUTH_001')
    );
  }
};

module.exports = verifyToken;
