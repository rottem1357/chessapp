const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({ url: REDIS_URL });

client.on('error', (err) => console.error('Redis Client Error', err));

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { client, connect };
