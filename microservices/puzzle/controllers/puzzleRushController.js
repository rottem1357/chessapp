const rushService = require('../services/puzzleRushService');
const logger = require('../utils/logger');

function start(req, res) {
  const { userId } = req.body;
  logger.info('Starting puzzle rush', { userId });
  const result = rushService.startSession(userId);
  res.json(result);
}

function move(req, res) {
  const { sessionId, correct } = req.body;
  const result = rushService.recordMove(sessionId, correct);
  if (!result) {
    return res.status(404).json({ error: 'session not found' });
  }
  res.json(result);
}

function finish(req, res) {
  const { sessionId } = req.body;
  const result = rushService.finishSession(sessionId);
  if (!result) {
    return res.status(404).json({ error: 'session not found' });
  }
  res.json(result);
}

function leaderboard(req, res) {
  const board = rushService.getLeaderboard();
  res.json(board);
}

module.exports = {
  start,
  move,
  finish,
  leaderboard,
};
