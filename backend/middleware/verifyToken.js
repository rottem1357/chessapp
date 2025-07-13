/**
 * JWT Verification Middleware
 * Protects routes by verifying JWT access tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { HTTP_STATUS } = require('../utils/constants');
const { formatErrorResponse } = require('../utils/helpers');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(formatErrorResponse('Access token missing'));
  }
  jwt.verify(token, config.auth?.jwtSecret || 'supersecretkey', (err, user) => {
    if (err) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(formatErrorResponse('Invalid or expired token'));
    }
    req.user = user;
    next();
  });
}

module.exports = verifyToken;
