// microservices/analysis/utils/logger.js
// Minimal logger utility

function formatMessage(level, message, meta) {
  const base = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

module.exports = {
  info: (message, meta) => {
    console.log(formatMessage('info', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta));
  }
};
