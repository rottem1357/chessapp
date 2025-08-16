// microservices/game-persistence/server.js
const express = require('express');
const { getArchiveById } = require('./controllers/archiveController');
const kafkaConsumer = require('./kafka/consumer');

const app = express();

app.get('/archive/:gameId', getArchiveById);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Game Persistence Service listening on port ${port}`);
  });
  kafkaConsumer.start().catch(err => {
    console.error('Kafka consumer failed', err);
  });
}

module.exports = app;
