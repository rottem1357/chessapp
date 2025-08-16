const deviceService = require('../services/deviceService');

exports.registerDevice = (req, res) => {
  const { userId, token, platform } = req.body;
  deviceService.registerDevice(userId, token, platform);
  res.status(201).json({ success: true });
};
