// middleware/verifyAdmin.js
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Middleware to verify user has admin privileges
 * Note: This should be used AFTER verifyToken middleware
 */
const verifyAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by verifyToken middleware)
    if (!req.user) {
      logger.warn('Admin verification attempted without authentication', { 
        ip: req.ip,
        path: req.path
      });
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatResponse(false, null, 'Authentication required for admin access', 'AUTH_003')
      );
    }

    // Check if user has admin privileges
    if (!req.user.is_admin) {
      logger.warn('Non-admin user attempted admin access', { 
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatResponse(false, null, 'Admin privileges required', 'AUTH_003')
      );
    }

    // User is authenticated and has admin privileges
    logger.debug('Admin access granted', { 
      userId: req.user.id,
      username: req.user.username,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Error in admin verification middleware', { 
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, 'Admin verification error', 'AUTH_003')
    );
  }
};

module.exports = verifyAdmin;
