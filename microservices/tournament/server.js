const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const tournamentRoutes = require('./routes/tournamentRoutes');

const app = express();

app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

app.use(express.json());
app.use('/tournaments', tournamentRoutes);

module.exports = app;

if (require.main === module) {
  const port = config.server.port;
  app.listen(port, () => logger.info(`Tournament service listening on port ${port}`));
}
