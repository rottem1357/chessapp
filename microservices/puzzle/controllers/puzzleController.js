const puzzleService = require('../services/puzzleService');
const logger = require('../utils/logger');

function getNextPuzzle(req, res) {
  const { userId } = req.query;
  logger.info('Fetching next puzzle', { userId });
  const puzzle = puzzleService.getNextPuzzle(userId);
  res.json(puzzle);
}

module.exports = { getNextPuzzle };
