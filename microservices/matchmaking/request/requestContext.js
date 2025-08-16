// request/requestContext.js
const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('X-Trace-ID', req.traceId);
  next();
};
