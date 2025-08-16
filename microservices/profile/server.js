const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');
const auth = require('./middleware/auth');
const profileRoutes = require('./routes/profileRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(auth);

app.use('/profiles', profileRoutes);
app.use('/friends', friendRoutes);

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Profile service listening on ${port}`);
  });
}

module.exports = app;
