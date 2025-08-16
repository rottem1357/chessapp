const { createClient } = require('redis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({ url: REDIS_URL });
client.on('error', (err) => logger.error('Redis error', { error: err.message }));

client.connect().then(() => logger.info('Redis connected'));

module.exports = client;
