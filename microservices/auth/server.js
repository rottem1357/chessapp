// microservices/auth/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const { connectDatabase } = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), { component: 'auth-service' })
  }
}));

// Add trace ID for request tracking
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || require('uuid').v4();
  res.setHeader('X-Trace-ID', req.traceId);
  res.setHeader('X-Service', 'auth-service');
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await require('./database/connection').checkConnection();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      service: 'auth-service',
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      traceId: req.traceId
    };
    
    const statusCode = dbStatus ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message, traceId: req.traceId });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      traceId: req.traceId
    });
  }
});

// Apply rate limiting to auth routes
app.use('/auth', authLimiter);

// Mount auth routes
app.use('/auth', authRoutes);

// For gateway compatibility, also mount at root
app.use('/', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start server
    const port = config.server.port;
    app.listen(port, () => {
      logger.info('Auth service started', {
        port,
        environment: config.server.environment,
        database: config.database.host
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  try {
    await require('./database/connection').closeConnection();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error: error.message });
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;