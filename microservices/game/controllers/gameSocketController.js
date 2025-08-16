const gameService = require('../services/gameService');
const logger = require('../utils/logger');

function register(io) {
  io.on('connection', (socket) => {
    socket.on('game:join', async ({ gameId }) => {
      socket.join(gameId);
      const snapshot = await gameService.getSnapshot(gameId);
      socket.emit('game.snapshot', snapshot);
    });

    socket.on('game:move', async ({ gameId, uci }) => {
      const result = await gameService.makeMove(gameId, uci);
      if (!result) return;
      io.to(gameId).emit('move.appended', { move: result.move });
      io.to(gameId).emit('game.snapshot', { fen: result.fen, clock: result.clock });
      if (result.gameOver) {
        io.to(gameId).emit('game.finished', result.gameOver);
      }
    });

    socket.on('game:state', async ({ gameId }) => {
      const snapshot = await gameService.getSnapshot(gameId);
      if (snapshot) {
        socket.emit('game.snapshot', snapshot);
      }
    });

    socket.on('game:offer_draw', ({ gameId }) => {
      io.to(gameId).emit('game.draw_offered');
    });

    socket.on('game:resign', ({ gameId, player }) => {
      io.to(gameId).emit('game.finished', {
        winner: player === 'w' ? 'b' : 'w',
        reason: 'resign'
      });
      gameService.endGame(gameId);
    });
  });
}

module.exports = { register };
