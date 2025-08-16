const redis = require('../db/redis');

const PRESENCE_TTL = parseInt(process.env.PRESENCE_TTL || '60', 10);

function presenceKey(userId) {
  return `presence:${userId}`;
}

async function setPresence(userId) {
  await redis.set(presenceKey(userId), 'online', { EX: PRESENCE_TTL });
}

async function clearPresence(userId) {
  await redis.del(presenceKey(userId));
}

async function checkPresence(userId) {
  const exists = await redis.exists(presenceKey(userId));
  return exists === 1;
}

module.exports = { setPresence, clearPresence, checkPresence };
