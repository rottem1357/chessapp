const notificationService = require('../services/notificationService');

exports.notify = async (req, res) => {
  try {
    const { idempotencyKey, message, channels, userId } = req.body;
    const result = await notificationService.sendNotification({ idempotencyKey, message, channels, userId });
    res.status(result.status === 'duplicate' ? 202 : 200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
