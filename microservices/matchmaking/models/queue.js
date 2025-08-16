// models/queue.js
const redis = require('../db/redis');

const QUEUE_PREFIX = 'mm:';
const queueKey = (mode) => `${QUEUE_PREFIX}${mode}`;

async function addPlayer(mode, rating, member) {
  return redis.zadd(queueKey(mode), rating, member);
}

async function removePlayer(mode, playerId) {
  const key = queueKey(mode);
  const members = await redis.zrange(key, 0, -1);
  for (const member of members) {
    try {
      const data = JSON.parse(member);
      if (data.playerId === playerId) {
        await redis.zrem(key, member);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function getQueue(mode) {
  return redis.zrange(queueKey(mode), 0, -1, 'WITHSCORES');
}

module.exports = { addPlayer, removePlayer, getQueue };
