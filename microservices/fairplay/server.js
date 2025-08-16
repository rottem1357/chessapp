const express = require('express');
const logger = require('./middleware/logger');
const fairplayRoutes = require('./routes/fairplay');

const app = express();
app.use(express.json());
app.use(logger);
app.use('/', fairplayRoutes);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Fair-Play service running on port ${port}`);
  });
}

module.exports = app;
