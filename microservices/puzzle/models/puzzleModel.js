const puzzles = require('../data/puzzles');

function getRandomPuzzle(excludeId) {
  let puzzle;
  do {
    puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  } while (puzzle.id === excludeId && puzzles.length > 1);
  return puzzle;
}

module.exports = { getRandomPuzzle };
