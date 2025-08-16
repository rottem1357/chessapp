const gameService = require('../services/gameService');

async function createGame(req, res) {
  try {
    const nodeId = await gameService.allocateGame(req.body.gameId);
    if (!nodeId) {
      return res.status(503).json({ error: 'No capacity available' });
    }
    return res.status(201).json({ nodeId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
}

async function getRouting(req, res) {
  const nodeId = await gameService.getNodeForGame(req.params.gameId);
  if (!nodeId) {
    return res.status(404).json({ error: 'Game not found' });
  }
  return res.json({ nodeId });
}

module.exports = { createGame, getRouting };
