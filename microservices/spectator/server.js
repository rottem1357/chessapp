const express = require('express');
const logger = require('./logger');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

app.use(logger);
app.use('/games', gameRoutes);

if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Spectator service listening on port ${port}`);
  });
}

module.exports = app;
