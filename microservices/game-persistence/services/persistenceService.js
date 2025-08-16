// microservices/game-persistence/services/persistenceService.js
const postgres = require('../database/postgres');
const mongo = require('../database/mongo');

const games = new Map();

async function handleMoveAppended(event) {
  const { gameId, move } = event;
  let game = games.get(gameId);
  if (!game) {
    game = { moves: [], finished: false };
    games.set(gameId, game);
  }
  if (game.moves.some(m => m.id === move.id)) {
    return { idempotent: true };
  }
  game.moves.push(move);
  await mongo.saveGameDoc(gameId, { moves: game.moves, result: game.result });
  return { success: true };
}

async function handleGameFinished(event) {
  const { gameId, result } = event;
  let game = games.get(gameId);
  if (!game) {
    game = { moves: [], finished: false };
    games.set(gameId, game);
  }
  if (game.finished) {
    return { idempotent: true };
  }
  game.finished = true;
  game.result = result;
  await postgres.saveGameSummary(gameId, { result, moveCount: game.moves.length });
  await mongo.saveGameDoc(gameId, { moves: game.moves, result });
  return { success: true };
}

async function getArchive(gameId) {
  const summary = await postgres.getGameSummary(gameId);
  const doc = await mongo.getGameDoc(gameId);
  if (!summary && !doc) return null;
  return { summary, doc };
}

function __reset() {
  games.clear();
  postgres.__reset();
  mongo.__reset();
}

module.exports = { handleMoveAppended, handleGameFinished, getArchive, __reset };
