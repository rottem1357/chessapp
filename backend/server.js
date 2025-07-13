const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Game state management
const games = new Map();
const waitingPlayers = [];

// Routes
const aiGameRoutes = require('./routes/aiGame');
app.use('/api/ai', aiGameRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/api/games', (req, res) => {
  const gameList = Array.from(games.values()).map(game => ({
    id: game.id,
    players: game.players.length,
    status: game.status
  }));
  res.json(gameList);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle player joining queue
  socket.on('join-queue', (playerData) => {
    try {
      const player = {
        id: socket.id,
        name: playerData.name || `Player ${socket.id.substring(0, 6)}`,
        rating: playerData.rating || 1200
      };

      waitingPlayers.push(player);
      socket.emit('queue-joined', { position: waitingPlayers.length });

      // Try to match players
      if (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        
        createGame(player1, player2);
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      socket.emit('error', { message: 'Failed to join queue' });
    }
  });

  // Handle moves
  socket.on('make-move', (data) => {
    try {
      const game = games.get(data.gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const chess = new Chess(game.fen);
      const move = chess.move(data.move);
      
      if (move) {
        game.fen = chess.fen();
        game.moves.push(move);
        
        // Check for game end
        if (chess.isGameOver()) {
          game.status = chess.isCheckmate() ? 'checkmate' : 
                       chess.isDraw() ? 'draw' : 'finished';
          game.winner = chess.isCheckmate() ? 
                       (chess.turn() === 'w' ? 'black' : 'white') : null;
        }

        // Broadcast move to both players
        game.players.forEach(playerId => {
          io.to(playerId).emit('move-made', {
            move: move,
            fen: game.fen,
            turn: chess.turn(),
            gameStatus: game.status,
            winner: game.winner
          });
        });
      } else {
        socket.emit('invalid-move', { error: 'Invalid move' });
      }
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const game = games.get(data.gameId);
    if (!game) return;

    const message = {
      id: uuidv4(),
      playerId: socket.id,
      playerName: data.playerName,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    game.players.forEach(playerId => {
      io.to(playerId).emit('chat-message', message);
    });
  });

  // Handle resignation
  socket.on('resign', (data) => {
    const game = games.get(data.gameId);
    if (!game) return;

    game.status = 'resigned';
    game.winner = game.players[0] === socket.id ? 'black' : 'white';

    game.players.forEach(playerId => {
      io.to(playerId).emit('game-ended', {
        reason: 'resignation',
        winner: game.winner
      });
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      console.log('User disconnected:', socket.id);
      
      // Remove from waiting queue
      const queueIndex = waitingPlayers.findIndex(p => p.id === socket.id);
      if (queueIndex > -1) {
        waitingPlayers.splice(queueIndex, 1);
      }

      // Handle game disconnection
      for (const [gameId, game] of games) {
        if (game.players.includes(socket.id)) {
          const otherPlayer = game.players.find(p => p !== socket.id);
          if (otherPlayer) {
            io.to(otherPlayer).emit('opponent-disconnected');
          }
          games.delete(gameId);
          break;
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Create a new game
function createGame(player1, player2) {
  const gameId = uuidv4();
  const chess = new Chess();
  
  const game = {
    id: gameId,
    players: [player1.id, player2.id],
    white: Math.random() > 0.5 ? player1.id : player2.id,
    black: null,
    fen: chess.fen(),
    moves: [],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  game.black = game.white === player1.id ? player2.id : player1.id;
  games.set(gameId, game);

  // Notify both players
  io.to(player1.id).emit('game-started', {
    gameId: gameId,
    color: game.white === player1.id ? 'white' : 'black',
    opponent: player2.name,
    fen: game.fen
  });

  io.to(player2.id).emit('game-started', {
    gameId: gameId,
    color: game.white === player2.id ? 'white' : 'black',
    opponent: player1.name,
    fen: game.fen
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
