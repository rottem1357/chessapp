/**
 * Error Handling Utilities
 * 
 * This module provides utilities for consistent error handling
 * throughout the application.
 */

import { ERROR_MESSAGES } from './constants';

/**
 * Custom error class for application-specific errors
 */
export class ChessAppError extends Error {
  constructor(message, code = 'GENERAL_ERROR', details = null) {
    super(message);
    this.name = 'ChessAppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GAME_ERROR: 'GAME_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
};

/**
 * Error handler for API responses
 * @param {Error} error - The error object
 * @returns {Object} Formatted error object
 */
export const handleApiError = (error) => {
  let errorCode = ERROR_CODES.GENERAL_ERROR;
  let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        errorMessage = data.message || 'Invalid request data';
        break;
      case 401:
        errorCode = ERROR_CODES.AUTH_ERROR;
        errorMessage = 'Authentication required';
        break;
      case 403:
        errorCode = ERROR_CODES.PERMISSION_ERROR;
        errorMessage = 'Access forbidden';
        break;
      case 404:
        errorCode = ERROR_CODES.NOT_FOUND_ERROR;
        errorMessage = data.message || 'Resource not found';
        break;
      case 408:
        errorCode = ERROR_CODES.TIMEOUT_ERROR;
        errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
        break;
      case 500:
        errorCode = ERROR_CODES.SERVER_ERROR;
        errorMessage = ERROR_MESSAGES.SERVER_ERROR;
        break;
      default:
        errorMessage = data.message || 'An unexpected error occurred';
    }
  } else if (error.request) {
    // Network error
    errorCode = ERROR_CODES.NETWORK_ERROR;
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  return new ChessAppError(errorMessage, errorCode, {
    originalError: error,
    url: error.config?.url,
    method: error.config?.method,
  });
};

/**
 * Error handler for game-specific errors
 * @param {Error} error - The error object
 * @param {string} gameId - Game ID for context
 * @returns {Object} Formatted error object
 */
export const handleGameError = (error, gameId = null) => {
  const baseError = handleApiError(error);
  
  // Add game-specific context
  if (gameId) {
    baseError.details = {
      ...baseError.details,
      gameId,
    };
  }
  
  // Map to game-specific error messages
  if (baseError.code === ERROR_CODES.NOT_FOUND_ERROR) {
    baseError.message = ERROR_MESSAGES.GAME_NOT_FOUND;
  } else if (baseError.code === ERROR_CODES.VALIDATION_ERROR) {
    baseError.message = ERROR_MESSAGES.INVALID_MOVE;
  }
  
  return baseError;
};

/**
 * Error handler for socket errors
 * @param {Error} error - The error object
 * @returns {Object} Formatted error object
 */
export const handleSocketError = (error) => {
  let errorMessage = ERROR_MESSAGES.CONNECTION_LOST;
  
  if (error.type === 'TransportError') {
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.description === 'xhr poll error') {
    errorMessage = ERROR_MESSAGES.CONNECTION_LOST;
  }
  
  return new ChessAppError(errorMessage, ERROR_CODES.NETWORK_ERROR, {
    originalError: error,
    errorType: error.type,
    description: error.description,
  });
};

/**
 * Generic error logger
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information
 */
export const logError = (error, context = 'Unknown', additionalInfo = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  console.error('Chess App Error:', errorInfo);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    // errorTrackingService.captureError(errorInfo);
  }
};

/**
 * Utility to create user-friendly error messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  if (error instanceof ChessAppError) {
    return error.message;
  }
  
  // Default message for unknown errors
  return ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Utility to check if error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} Whether the error is retryable
 */
export const isRetryableError = (error) => {
  if (error instanceof ChessAppError) {
    return [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.SERVER_ERROR,
    ].includes(error.code);
  }
  
  return false;
};

/**
 * Utility to extract error details for debugging
 * @param {Error} error - The error object
 * @returns {Object} Error details
 */
export const getErrorDetails = (error) => {
  if (error instanceof ChessAppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
    };
  }
  
  return {
    message: error.message,
    code: ERROR_CODES.GENERAL_ERROR,
    details: {
      name: error.name,
      stack: error.stack,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Higher-order function to wrap async functions with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (fn, context = 'Unknown') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handledError = handleApiError(error);
      logError(handledError, context, { args });
      throw handledError;
    }
  };
};

/**
 * React error boundary utility
 * @param {Error} error - The error object
 * @param {Object} errorInfo - Error info from React
 */
export const handleReactError = (error, errorInfo) => {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  };
  
  logError(error, 'React Error Boundary', errorDetails);
};

/**
 * General error handler for application errors
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} Formatted error object with user-friendly message
 */
export const handleError = (error, context = 'Unknown') => {
  const errorDetails = getErrorDetails(error);
  const userFriendlyMessage = getUserFriendlyErrorMessage(error);
  
  logError(error, context, errorDetails);
  
  return {
    message: userFriendlyMessage,
    code: errorDetails.code,
    details: errorDetails,
    timestamp: new Date().toISOString(),
  };
};

const errorHandler = {
  ChessAppError,
  ERROR_CODES,
  handleApiError,
  handleGameError,
  handleSocketError,
  handleError,
  logError,
  getUserFriendlyErrorMessage,
  isRetryableError,
  getErrorDetails,
  withErrorHandling,
  handleReactError,
};

export default errorHandler;
