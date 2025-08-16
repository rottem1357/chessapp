const chatService = require('../services/chatService');
const presenceService = require('../services/presenceService');
const logger = require('../utils/logger');

const messageTimestamps = new Map();
const RATE_LIMIT_MS = 500;

function handleConnection(io, socket) {
  const userId = socket.handshake.auth?.userId || socket.id;

  presenceService.markOnline(userId).catch(err =>
    logger.error('Presence set error', { error: err.message })
  );

  socket.on('chat:send', async ({ room = 'lobby', message }) => {
    const last = messageTimestamps.get(userId) || 0;
    const now = Date.now();
    if (now - last < RATE_LIMIT_MS) {
      socket.emit('chat:error', 'Rate limit exceeded');
      return;
    }
    messageTimestamps.set(userId, now);

    // TODO: moderation hooks
    try {
      await chatService.sendMessage(room, userId, message);
      io.to(room).emit('chat:message', {
        room,
        senderId: userId,
        message,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Chat send error', { error: err.message });
      socket.emit('chat:error', 'Message not sent');
    }
  });

  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    presenceService.markOffline(userId).catch(err =>
      logger.error('Redis disconnect error', { error: err.message })
    );
  });
}

module.exports = { handleConnection };
