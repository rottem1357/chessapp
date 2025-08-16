// microservices/auth/config/index.js
require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.AUTH_PORT || '8083'),
    environment: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'auth_db',
    user: process.env.DB_USER || 'auth_user',
    password: process.env.DB_PASSWORD || 'auth_password',
    ssl: process.env.NODE_ENV === 'production'
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:8080']
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB || '1') // Use DB 1 for auth service
  }
};

module.exports = config;