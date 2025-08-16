// microservices/gateway/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7)
    : null;

  // Add auth info to request for downstream services
  req.auth = {
    token,
    user: null,
    isAuthenticated: false
  };

  // If no token, continue (some routes might be public)
  if (!token) {
    return next();
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret);
    req.auth.user = decoded;
    req.auth.isAuthenticated = true;
    
    // Add user info headers for downstream services
    req.headers['x-user-id'] = decoded.userId || decoded.id;
    req.headers['x-user-role'] = decoded.role || 'user';
    
    logger.debug('Token verified', {
      traceId: req.traceId,
      userId: decoded.userId || decoded.id
    });
    
  } catch (error) {
    logger.warn('Token verification failed', {
      traceId: req.traceId,
      error: error.message
    });
    
    // Don't block request - let downstream service handle auth
    // This allows services to have their own auth requirements
  }

  next();
};

module.exports = { authMiddleware };