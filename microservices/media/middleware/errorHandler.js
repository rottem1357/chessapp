const logger = require('../utils/logger');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const notFound = (req, res) => {
  res.status(404).json({ message: 'Not found' });
};

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, traceId: req.traceId });
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};

module.exports = { asyncHandler, notFound, errorHandler };
