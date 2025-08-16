const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const { connect } = require('./db/redis');
const gameRoutes = require('./routes/gameRoutes');
const socketController = require('./controllers/gameSocketController');

const PORT = process.env.PORT || 8080;

async function start() {
  await connect();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  app.use('/games', gameRoutes);

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  socketController.register(io);

  app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  server.listen(PORT, () => {
    logger.info(`Game service listening on ${PORT}`);
  });
}

start();
