const express = require('express');
const logger = require('./logger');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
app.use(logger);
app.use(express.json());
app.use(gameRoutes);

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Game coordinator listening on port ${port}`);
  });
}

module.exports = app;
