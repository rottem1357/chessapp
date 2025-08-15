const Redis = require('ioredis');

function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const base = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  base.on('error', (e) => console.error('[redis] error', e.message));
  base.on('connect', () => console.log('[redis] connected'));
  return base;
}

let client, sub;

function getClient() {
  if (!client) client = createClient();
  return client;
}

function getSubscriber() {
  if (!sub && process.env.MM_PUBSUB_ENABLED === 'true') {
    sub = createClient();
  }
  return sub;
}

module.exports = { getClient, getSubscriber };
