let Redis = require('ioredis');

// Allow tests to swap in an in-memory mock by setting MOCK_REDIS
if (process.env.MOCK_REDIS) {
  Redis = require('ioredis-mock');
}

// Create a Redis client. The URL can be configured via the REDIS_URL environment variable.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

module.exports = redis;
