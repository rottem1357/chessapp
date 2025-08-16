// microservices/auth/middleware/validation.js
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse, isValidEmail, isValidUsername, isValidPassword } = require('../utils/helpers');

/**
 * Validate registration request
 */
const validateRegister = (req, res, next) => {
  const { username, email, password, display_name, country } = req.body;
  const errors = [];

  // Required fields
  if (!username) errors.push('Username is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  // Format validation
  if (username && !isValidUsername(username)) {
    errors.push('Username must be 3-50 characters long and contain only letters, numbers, and underscores');
  }
  
  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }
  
  if (password && !isValidPassword(password)) {
    errors.push('Password must be at least 8 characters long');
  }

  // Optional field validation
  if (display_name && display_name.length > 100) {
    errors.push('Display name must be less than 100 characters');
  }

  if (country && (typeof country !== 'string' || country.length !== 2)) {
    errors.push('Country must be a 2-letter country code');
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  next();
};

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username) errors.push('Username or email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  next();
};

/**
 * Validate password reset request
 */
const validatePasswordResetRequest = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  if (email && !isValidEmail(email)) errors.push('Invalid email format');

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  next();
};

/**
 * Validate password reset confirmation
 */
const validatePasswordResetConfirm = (req, res, next) => {
  const { token, new_password } = req.body;
  const errors = [];

  if (!token) errors.push('Reset token is required');
  if (!new_password) errors.push('New password is required');
  if (new_password && !isValidPassword(new_password)) {
    errors.push('New password must be at least 8 characters long');
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  next();
};

/**
 * Validate change password request
 */
const validateChangePassword = (req, res, next) => {
  const { current_password, new_password } = req.body;
  const errors = [];

  if (!current_password) errors.push('Current password is required');
  if (!new_password) errors.push('New password is required');
  if (new_password && !isValidPassword(new_password)) {
    errors.push('New password must be at least 8 characters long');
  }
  if (current_password === new_password) {
    errors.push('New password must be different from current password');
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
  validateChangePassword
};