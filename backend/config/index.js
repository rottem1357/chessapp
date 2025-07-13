/**
 * Application Configuration
 * Centralizes all configuration settings for the chess application
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration (for future use)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'chessapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  },

  // JWT Configuration (for future auth)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Socket.IO Configuration
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000
  },

  // Game Configuration
  game: {
    maxGames: parseInt(process.env.MAX_GAMES) || 1000,
    gameTimeout: parseInt(process.env.GAME_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
    moveTimeout: parseInt(process.env.MOVE_TIMEOUT) || 5 * 60 * 1000, // 5 minutes
    maxChatMessageLength: parseInt(process.env.MAX_CHAT_MESSAGE_LENGTH) || 500,
    maxPlayerNameLength: parseInt(process.env.MAX_PLAYER_NAME_LENGTH) || 50
  },

  // AI Configuration
  ai: {
    maxConcurrentGames: parseInt(process.env.AI_MAX_CONCURRENT_GAMES) || 100,
    defaultDifficulty: process.env.AI_DEFAULT_DIFFICULTY || 'intermediate',
    maxThinkingTime: parseInt(process.env.AI_MAX_THINKING_TIME) || 5000,
    cleanupInterval: parseInt(process.env.AI_CLEANUP_INTERVAL) || 30 * 60 * 1000 // 30 minutes
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200
  }
};

// Validate required configuration
const requiredConfig = ['server.port', 'jwt.secret'];

function validateConfig() {
  const errors = [];
  
  requiredConfig.forEach(path => {
    const value = path.split('.').reduce((obj, key) => obj && obj[key], config);
    if (!value) {
      errors.push(`Missing required configuration: ${path}`);
    }
  });

  if (errors.length > 0) {
    throw new Error('Configuration validation failed:\n' + errors.join('\n'));
  }
}

// Validate configuration on startup
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
