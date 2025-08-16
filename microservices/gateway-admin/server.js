const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const loggerMiddleware = require('./middleware/logger');
const healthRoutes = require('./routes/healthRoutes');
const flagRoutes = require('./routes/flagRoutes');
const registryRoutes = require('./routes/registryRoutes');
const { registerService } = require('./services/registryService');
require('./services/jwksService');

const app = express();
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use(limiter);

app.use(loggerMiddleware);

app.use('/', healthRoutes);
app.use('/flags', flagRoutes);
app.use('/registry', registryRoutes);

registerService('gateway', 'http://localhost:3000');

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Gateway Admin service listening on port ${port}`);
});

module.exports = { app };
