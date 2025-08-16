const chatService = require('../services/chatService');
const logger = require('../utils/logger');

async function getHistory(req, res) {
  const room = req.query.room || 'lobby';
  try {
    const data = await chatService.getHistory(room);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('History error', { error: err.message });
    res.status(500).json({ success: false, message: 'Could not fetch history' });
  }
}

module.exports = { getHistory };
