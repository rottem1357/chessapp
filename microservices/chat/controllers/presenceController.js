const presenceService = require('../services/presenceService');
const logger = require('../utils/logger');

async function getPresence(req, res) {
  const user = req.params.user;
  try {
    const online = await presenceService.getPresence(user);
    res.json({ user, online });
  } catch (err) {
    logger.error('Presence error', { error: err.message });
    res.status(500).json({ success: false, message: 'Could not check presence' });
  }
}

module.exports = { getPresence };
