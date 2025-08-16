const gameService = require('../services/gameService');

async function getGameState(req, res) {
  const { id } = req.params;
  try {
    const state = await gameService.fetchGameState(id);
    res.json({ id, state });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load game state' });
  }
}

async function getMoves(req, res) {
  const { id } = req.params;
  const since = parseInt(req.query.since || '0', 10);
  try {
    const { moves, next, total } = await gameService.fetchMovesSince(id, since);
    res.json({ id, moves, next, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load moves' });
  }
}

module.exports = { getGameState, getMoves };
