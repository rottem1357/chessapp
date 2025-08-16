// microservices/gateway/config/index.js
require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.GATEWAY_PORT || '8080'),
    environment: process.env.NODE_ENV || 'development'
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000') // requests per window
  },
  
  proxy: {
    timeout: parseInt(process.env.PROXY_TIMEOUT || '30000'), // 30 seconds
    retries: parseInt(process.env.PROXY_RETRIES || '3')
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    algorithm: 'HS256'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  // Service discovery configuration
  services: {
    // Initially, everything routes to your existing monolith
    'auth-service': {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    },
    'profiles-service': {
      url: process.env.PROFILES_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    },
    'ratings-service': {
      url: process.env.RATINGS_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    },
    'matchmaking-service': {
      url: process.env.MATCHMAKING_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    },
    'game-orchestrator': {
      url: process.env.GAME_ORCHESTRATOR_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000,
      websocket: true
    },
    'ai-service': {
      url: process.env.AI_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 10000 // AI might need more time
    },
    'game-archive': {
      url: process.env.GAME_ARCHIVE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    },
    'admin-service': {
      url: process.env.ADMIN_SERVICE_URL || 'http://localhost:5000',
      healthPath: '/api/health',
      timeout: 5000
    }
  }
};

module.exports = config;