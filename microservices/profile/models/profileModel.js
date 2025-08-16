const db = require('../db');

function getProfile(id) {
  return db.profiles[id] || null;
}

function saveProfile(profile) {
  db.profiles[profile.id] = profile;
  return profile;
}

function getStats(id) {
  const profile = db.profiles[id];
  return profile ? profile.stats || { wins: 0, losses: 0 } : null;
}

function addFriend(userId, friendId) {
  db.friends.push({ userId, friendId, status: 'pending' });
  return { status: 'pending' };
}

module.exports = { getProfile, saveProfile, getStats, addFriend };
