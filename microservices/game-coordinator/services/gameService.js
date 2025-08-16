const gameModel = require('../models/gameModel');

async function allocateGame(gameId) {
  const nodeId = await gameModel.selectNode();
  if (!nodeId) return null;
  await gameModel.assignGame(gameId, nodeId);
  return nodeId;
}

function getNodeForGame(gameId) {
  return gameModel.getRoute(gameId);
}

module.exports = { allocateGame, getNodeForGame };
