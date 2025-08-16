const gameService = require('../services/gameService');
const logger = require('../utils/logger');

async function getGame(req, res) {
  const { id } = req.params;
  logger.info('Fetching game snapshot', { id });
  const snapshot = await gameService.getSnapshot(id);
  res.json({ id, ...snapshot });
}

async function endGame(req, res) {
  const { id } = req.params;
  logger.info('Admin ending game', { id });
  await gameService.endGame(id);
  res.status(204).end();
}

module.exports = {
  getGame,
  endGame
};
