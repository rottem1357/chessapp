/**
 * API Service Layer
 * 
 * This module provides a centralized HTTP client for all API communications.
 * It handles request/response formatting, error handling, and authentication.
 */

import axios from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '../utils/constants';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add authentication and common headers
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle common errors and format responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration for debugging
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    console.log(`API Request to ${response.config.url} took ${duration}ms`);
    
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data.message || 'Bad request';
          break;
        case 401:
          error.message = 'Unauthorized. Please log in again.';
          // Clear auth token if unauthorized
          localStorage.removeItem('auth_token');
          break;
        case 403:
          error.message = 'Forbidden. You don\'t have permission to access this resource.';
          break;
        case 404:
          error.message = data.message || 'Resource not found';
          break;
        case 500:
          error.message = ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          error.message = data.message || 'An unexpected error occurred';
      }
    } else if (error.request) {
      // Network error
      error.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // Other error
      error.message = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic API request wrapper
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request payload
 * @param {Object} options - Additional axios options
 * @returns {Promise} API response
 */
const request = async (method, url, data = null, options = {}) => {
  try {
    const config = {
      method,
      url,
      ...options,
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * API methods
 */
export const api = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  get: (url, options = {}) => request('GET', url, null, options),
  
  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  post: (url, data, options = {}) => request('POST', url, data, options),
  
  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  put: (url, data, options = {}) => request('PUT', url, data, options),
  
  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  delete: (url, options = {}) => request('DELETE', url, null, options),
  
  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  patch: (url, data, options = {}) => request('PATCH', url, data, options),
};

/**
 * Utility function to handle API responses
 * @param {Promise} apiCall - API call promise
 * @returns {Object} { data, error, loading }
 */
export const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall;
    return {
      data: response.data || response,
      error: null,
      success: response.success !== undefined ? response.success : true,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || ERROR_MESSAGES.SERVER_ERROR,
      success: false,
    };
  }
};

/**
 * Utility function to create query string from object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
export const createQueryString = (params) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return queryParams.toString();
};

/**
 * Utility function to build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} Complete URL with query string
 */
export const buildUrl = (baseUrl, params = {}) => {
  const queryString = createQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export default api;
