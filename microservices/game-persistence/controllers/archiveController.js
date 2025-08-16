// microservices/game-persistence/controllers/archiveController.js
const { getArchive } = require('../services/persistenceService');

async function getArchiveById(req, res) {
  try {
    const archive = await getArchive(req.params.gameId);
    if (!archive) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(archive);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getArchiveById };
