const deviceModel = require('../models/deviceModel');

function registerDevice(userId, token, platform) {
  return deviceModel.addDevice(userId, token, platform);
}

function getDevices(userId) {
  return deviceModel.findDevices(userId);
}

module.exports = { registerDevice, getDevices };
