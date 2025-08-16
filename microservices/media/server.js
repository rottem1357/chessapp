const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./utils/logger');
const filesRoutes = require('./routes/files');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('X-Trace-ID', req.traceId);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'media-service' });
});

app.use('/files', filesRoutes);

app.use(notFound);
app.use(errorHandler);

const port = config.server.port;
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Media service listening on port ${port}`);
  });
}

module.exports = app;
