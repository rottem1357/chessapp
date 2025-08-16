const { Chess } = require('chess.js');
const gameModel = require('../models/gameModel');

const games = new Map(); // in-memory game state

function getOrCreateGame(id) {
  let game = games.get(id);
  if (!game) {
    game = { chess: new Chess(), clock: { w: 300000, b: 300000 }, moves: [] };
    games.set(id, game);
  }
  return game;
}

async function getSnapshot(id) {
  const game = games.get(id);
  if (game) {
    return { fen: game.chess.fen(), clock: game.clock, moves: game.moves };
  }
  return gameModel.getSnapshot(id);
}

async function makeMove(id, uci) {
  const game = getOrCreateGame(id);
  const move = game.chess.move(uci, { sloppy: true });
  if (!move) return null;
  game.moves.push(move.san);
  await gameModel.saveSnapshot(id, game.chess.fen(), game.clock);
  const result = {
    move: move.san,
    fen: game.chess.fen(),
    clock: game.clock,
    gameOver: game.chess.isGameOver() ? { result: game.chess.result ? game.chess.result() : undefined } : null
  };
  return result;
}

async function endGame(id) {
  games.delete(id);
  await gameModel.deleteSnapshot(id);
}

module.exports = {
  getSnapshot,
  makeMove,
  endGame,
  getOrCreateGame
};
