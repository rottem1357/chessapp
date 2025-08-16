const rushModel = require('../models/puzzleRushModel');

function startSession(userId) {
  const session = rushModel.createSession(userId);
  return { sessionId: session.id };
}

function recordMove(sessionId, correct) {
  const session = rushModel.getSession(sessionId);
  if (!session || session.finished) {
    return null;
  }
  session.moves.push({ correct });
  if (correct) {
    session.score += 1;
  }
  rushModel.updateSession(session);
  return { score: session.score, moves: session.moves.length };
}

function finishSession(sessionId) {
  const session = rushModel.getSession(sessionId);
  if (!session || session.finished) {
    return null;
  }
  session.finished = true;
  rushModel.updateSession(session);
  rushModel.addLeaderboardEntry(session.userId, session.score);
  return { score: session.score };
}

function getLeaderboard() {
  return rushModel.getLeaderboard();
}

module.exports = {
  startSession,
  recordMove,
  finishSession,
  getLeaderboard,
};
