const profileModel = require('../models/profileModel');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

function cacheKey(id) {
  return `profile:${id}`;
}

async function getProfile(id) {
  try {
    const cached = await redis.get(cacheKey(id));
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn('Redis get failed', { error: err.message });
  }

  const profile = profileModel.getProfile(id);
  if (!profile) return null;

  try {
    await redis.set(cacheKey(id), JSON.stringify(profile));
  } catch (err) {
    logger.warn('Redis set failed', { error: err.message });
  }

  return profile;
}

async function updateProfile(id, data) {
  const existing = profileModel.getProfile(id) || { id, stats: { wins: 0, losses: 0 } };
  const updated = profileModel.saveProfile({ ...existing, ...data, id });

  try {
    await redis.set(cacheKey(id), JSON.stringify(updated));
  } catch (err) {
    logger.warn('Redis set failed', { error: err.message });
  }

  return updated;
}

async function getStats(id) {
  return profileModel.getStats(id);
}

async function addFriend(userId, friendId) {
  return profileModel.addFriend(userId, friendId);
}

module.exports = { getProfile, updateProfile, getStats, addFriend };
