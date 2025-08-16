const Redis = process.env.NODE_ENV === 'test' ? require('ioredis-mock') : require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
module.exports = redis;
