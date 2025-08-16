const presenceModel = require('../models/presenceModel');

async function getPresence(userId) {
  return presenceModel.checkPresence(userId);
}

async function markOnline(userId) {
  await presenceModel.setPresence(userId);
}

async function markOffline(userId) {
  await presenceModel.clearPresence(userId);
}

module.exports = { getPresence, markOnline, markOffline };
