const puzzleModel = require('../models/puzzleModel');

const lastPuzzleByUser = new Map();

function getNextPuzzle(userId) {
  const lastId = lastPuzzleByUser.get(userId);
  const puzzle = puzzleModel.getRandomPuzzle(lastId);
  lastPuzzleByUser.set(userId, puzzle.id);
  return puzzle;
}

module.exports = { getNextPuzzle };
