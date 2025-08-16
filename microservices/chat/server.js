const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./utils/logger');
const chatRoutes = require('./routes/chatRoutes');
const { handleConnection } = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// Routes
app.use(chatRoutes);

// Socket.io
io.on('connection', (socket) => handleConnection(io, socket));

if (require.main === module) {
  server.listen(PORT, () => {
    logger.info(`Chat service listening on port ${PORT}`);
  });
}

module.exports = { app, server, io };
