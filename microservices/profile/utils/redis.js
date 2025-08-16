const Redis = require('ioredis');
const logger = require('./logger');

let redis;
if (process.env.NODE_ENV === 'test') {
  redis = {
    get: async () => null,
    set: async () => {},
    disconnect: () => {},
  };
} else {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true });
  redis.on('error', (err) => logger.warn('Redis error', { error: err.message }));
}

module.exports = redis;
