const gameModel = require('../models/gameModel');

async function fetchGameState(id) {
  const state = await gameModel.getState(id);
  await gameModel.incrementSpectators(id);
  return state;
}

async function fetchMovesSince(id, since) {
  return gameModel.getMovesSince(id, since);
}

module.exports = { fetchGameState, fetchMovesSince };
