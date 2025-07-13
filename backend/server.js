/**
 * Chess App Backend Server
 * Main server entry point for the chess application
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Import configuration and utilities
const config = require('./config');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// Import routes
const gameRoutes = require('./routes/games');
const aiRoutes = require('./routes/aiGame');

// Import services
const SocketService = require('./services/socketService');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: config.socket.corsOrigin,
    methods: ["GET", "POST"]
  },
  pingTimeout: config.socket.pingTimeout,
  pingInterval: config.socket.pingInterval
});

// Initialize services
const socketService = new SocketService(io);

// Global middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
if (config.server.environment === 'development') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Chess App Backend',
    version: '1.0.0',
    status: 'running',
    environment: config.server.environment,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', gameRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(config.server.port, () => {
  logger.info('Server started', {
    port: config.server.port,
    environment: config.server.environment,
    corsOrigin: config.socket.corsOrigin
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = { app, server, io };
