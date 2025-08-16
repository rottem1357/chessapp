// server.js
const express = require('express');
const morgan = require('morgan');

const requestContext = require('./request/requestContext');
const logger = require('./logger');
const routes = require('./routes/matchmakingRoutes');
const { events } = require('./services/matchmakingService');

const app = express();
app.use(express.json());
app.use(requestContext);
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/', routes);

events.on('match.found', (payload) => {
  logger.info('match.found', payload);
});

const PORT = process.env.PORT || 8086;
app.listen(PORT, () => {
  logger.info(`Matchmaking service listening on ${PORT}`);
});

module.exports = { app, events };
