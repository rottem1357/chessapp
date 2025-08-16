const devices = new Map(); // userId -> Set of tokens

function addDevice(userId, token, platform) {
  if (!devices.has(userId)) {
    devices.set(userId, new Set());
  }
  devices.get(userId).add(token);
  return { userId, token, platform };
}

function findDevices(userId) {
  const tokens = devices.get(userId);
  return tokens ? Array.from(tokens) : [];
}

module.exports = { addDevice, findDevices };
