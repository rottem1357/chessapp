const chatModel = require('../models/chatModel');

async function getHistory(room) {
  return chatModel.getHistory(room);
}

async function sendMessage(room, senderId, message) {
  await chatModel.saveMessage(room, senderId, message);
}

module.exports = { getHistory, sendMessage };
