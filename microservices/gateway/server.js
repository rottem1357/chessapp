// microservices/gateway/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./utils/logger');
const { serviceRegistry } = require('./services/serviceRegistry');
const { authMiddleware } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Trace-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add trace ID for request tracking
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('X-Trace-ID', req.traceId);
  next();
});

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), { component: 'gateway' })
  }
}));

// Health check
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: serviceRegistry.getHealthStatus(),
    uptime: process.uptime(),
    traceId: req.traceId
  };
  
  logger.info('Health check requested', { traceId: req.traceId, health });
  res.json(health);
});

// Service status endpoint
app.get('/services', (req, res) => {
  const services = serviceRegistry.getAllServices();
  res.json({
    success: true,
    data: services,
    timestamp: new Date().toISOString(),
    traceId: req.traceId
  });
});

// JWT verification for protected routes (doesn't authenticate, just validates)
app.use('/api', authMiddleware);

// Route definitions with service mapping
const routes = [
  {
    path: '/api/auth',
    target: 'auth-service',
    description: 'Authentication and user management'
  },
  {
    path: '/api/users',
    target: 'profiles-service',
    description: 'User profiles and social features'
  },
  {
    path: '/api/friends',
    target: 'profiles-service',
    description: 'Friend management'
  },
  {
    path: '/api/ratings',
    target: 'ratings-service',
    description: 'Player ratings and leaderboards'
  },
  {
    path: '/api/matchmaking',
    target: 'matchmaking-service',
    description: 'Game matchmaking and queues'
  },
  {
    path: '/api/games',
    target: 'game-orchestrator',
    description: 'Game management and real-time gameplay'
  },
  {
    path: '/api/ai',
    target: 'ai-service',
    description: 'AI opponent moves'
  },
  {
    path: '/api/puzzles',
    target: 'game-archive',
    description: 'Chess puzzles and challenges'
  },
  {
    path: '/api/openings',
    target: 'game-archive',
    description: 'Chess opening database'
  },
  {
    path: '/api/statistics',
    target: 'game-archive',
    description: 'Game statistics and analytics'
  },
  {
    path: '/api/admin',
    target: 'admin-service',
    description: 'Administrative functions'
  }
];

// Create proxy middleware for each route
routes.forEach(route => {
  const proxyOptions = {
    target: serviceRegistry.getServiceUrl(route.target),
    changeOrigin: true,
    timeout: config.proxy.timeout,
    retries: config.proxy.retries,
    
    // Add trace ID to proxied requests
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Trace-ID', req.traceId);
      proxyReq.setHeader('X-Gateway-Source', 'chess-gateway');
      
      logger.info('Proxying request', {
        traceId: req.traceId,
        method: req.method,
        path: req.path,
        target: route.target,
        targetUrl: serviceRegistry.getServiceUrl(route.target)
      });
    },
    
    // Handle proxy errors
    onError: (err, req, res) => {
      logger.error('Proxy error', {
        traceId: req.traceId,
        error: err.message,
        target: route.target,
        path: req.path
      });
      
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        errorCode: 'SERVICE_UNAVAILABLE',
        traceId: req.traceId
      });
    },
    
    // Log successful proxy responses
    onProxyRes: (proxyRes, req, res) => {
      logger.info('Proxy response', {
        traceId: req.traceId,
        statusCode: proxyRes.statusCode,
        target: route.target
      });
    }
  };
  
  app.use(route.path, createProxyMiddleware(proxyOptions));
});

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  logger.warn('Route not found', {
    traceId: req.traceId,
    method: req.method,
    path: req.path
  });
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    errorCode: 'ENDPOINT_NOT_FOUND',
    traceId: req.traceId,
    availableRoutes: routes.map(r => ({ path: r.path, description: r.description }))
  });
});

// WebSocket proxy for real-time features
const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.cors.allowedOrigins,
    credentials: true
  }
});

// Proxy WebSocket connections to game orchestrator
io.on('connection', (socket) => {
  logger.info('WebSocket connection established', {
    socketId: socket.id,
    userId: socket.handshake.auth?.userId
  });
  
  // Forward to game orchestrator
  const gameOrchestratorUrl = serviceRegistry.getServiceUrl('game-orchestrator');
  
  // In production, you'd use socket.io-redis-adapter or similar
  // For now, we'll handle basic forwarding
  socket.on('join-game', (data) => {
    logger.info('Forwarding join-game to orchestrator', {
      socketId: socket.id,
      gameId: data.gameId
    });
    // Forward to game orchestrator service
  });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket disconnected', { socketId: socket.id });
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Starting graceful shutdown...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
if (process.env.NODE_ENV !== 'test') {
  const port = config.server.port;
  server.listen(port, () => {
    logger.info('Gateway service started', {
      port,
      environment: config.server.environment,
      services: serviceRegistry.getAllServices()
    });
  });
}

module.exports = { app, server, io };