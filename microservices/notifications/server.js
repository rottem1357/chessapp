const express = require('express');
const notificationsRouter = require('./routes/notifications');
const devicesRouter = require('./routes/devices');
const logger = require('./middlewares/logger');

const app = express();
app.use(express.json());
app.use(logger);

app.use('/notify', notificationsRouter);
app.use('/devices', devicesRouter);

const PORT = process.env.PORT || 8090;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Notifications service listening on port ${PORT}`));
}

module.exports = app;
