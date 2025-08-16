// services/matchmakingService.js
const { EventEmitter } = require('events');
const queueModel = require('../models/queue');

const events = new EventEmitter();

function ratingWindow(waitSeconds) {
  return 50 + waitSeconds * 50;
}

async function findMatch(mode, rating, playerId) {
  const now = Date.now();
  const entries = await queueModel.getQueue(mode);
  for (let i = 0; i < entries.length; i += 2) {
    const member = entries[i];
    const score = parseFloat(entries[i + 1]);
    let data;
    try {
      data = JSON.parse(member);
    } catch (_) {
      continue;
    }
    if (data.playerId === playerId) continue;
    const waitSeconds = (now - data.ts) / 1000;
    const window = ratingWindow(waitSeconds);
    if (Math.abs(rating - score) <= window) {
      await queueModel.removePlayer(mode, data.playerId);
      await queueModel.removePlayer(mode, playerId);
      return { playerId: data.playerId, region: data.region };
    }
  }
  return null;
}

async function joinQueue(payload) {
  const { playerId, mode, rating, region } = payload;
  const ts = Date.now();
  const member = JSON.stringify({ playerId, ts, region });
  await queueModel.addPlayer(mode, rating, member);
  const match = await findMatch(mode, rating, playerId);
  if (match) {
    events.emit('match.found', { p1: playerId, p2: match.playerId, mode, region: match.region || region });
    return { matched: true, opponent: match.playerId };
  }
  return { matched: false };
}

async function leaveQueue(payload) {
  const { playerId, mode } = payload;
  const removed = await queueModel.removePlayer(mode, playerId);
  return { removed };
}

async function getQueueState(mode) {
  const entries = await queueModel.getQueue(mode);
  const out = [];
  for (let i = 0; i < entries.length; i += 2) {
    try {
      const data = JSON.parse(entries[i]);
      out.push({ playerId: data.playerId, rating: parseFloat(entries[i + 1]), ts: data.ts, region: data.region });
    } catch (_) {}
  }
  return out;
}

module.exports = {
  joinQueue,
  leaveQueue,
  getQueueState,
  events,
};
