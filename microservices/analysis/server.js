// microservices/analysis/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const analysisRoutes = require('./routes/analysis');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// Logger middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Trace ID middleware
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('X-Trace-ID', req.traceId);
  res.setHeader('X-Service', 'analysis-service');
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'analysis-service',
    traceId: req.traceId
  });
});

app.use('/analysis', analysisRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found', traceId: req.traceId });
});

const port = process.env.PORT || 8088;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Analysis service listening on port ${port}`);
  });
}

module.exports = app;
