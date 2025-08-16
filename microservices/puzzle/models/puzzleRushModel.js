const { v4: uuidv4 } = require('uuid');

const sessions = new Map();
const leaderboard = [];

function createSession(userId) {
  const id = uuidv4();
  const session = { id, userId, moves: [], score: 0, finished: false };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

function updateSession(session) {
  sessions.set(session.id, session);
}

function addLeaderboardEntry(userId, score) {
  leaderboard.push({ userId, score });
  leaderboard.sort((a, b) => b.score - a.score);
}

function getLeaderboard(limit = 10) {
  return leaderboard.slice(0, limit);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  addLeaderboardEntry,
  getLeaderboard,
};
