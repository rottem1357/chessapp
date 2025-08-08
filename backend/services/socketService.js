/**
 * Socket Service
 * Handles WebSocket connections and real-time game communication
 */

const { SOCKET_EVENTS, ERROR_MESSAGES } = require('../utils/constants');
const { 
  sanitizePlayerName, 
  sanitizeChatMessage,
  formatResponse 
} = require('../utils/helpers');
const logger = require('../utils/logger');
const gameService = require('./gameService');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedPlayers = new Map(); // socketId -> playerData
    this.playerSockets = new Map(); // playerId -> socketId
    
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket.IO socket instance
   */
  handleConnection(socket) {
    logger.info('User connected', { socketId: socket.id, ip: socket.handshake.address });

    // Join queue event
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (playerData) => {
      this.handleJoinQueue(socket, playerData);
    });

    // Make move event
    socket.on(SOCKET_EVENTS.MAKE_MOVE, (data) => {
      this.handleMakeMove(socket, data);
    });

    // Chat message event
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
      this.handleChatMessage(socket, data);
    });

    // Resign event
    socket.on(SOCKET_EVENTS.RESIGN, (data) => {
      this.handleResign(socket, data);
    });

    // Draw request events
    socket.on(SOCKET_EVENTS.REQUEST_DRAW, (data) => {
      this.handleDrawRequest(socket, data);
    });

    socket.on(SOCKET_EVENTS.RESPOND_DRAW, (data) => {
      this.handleDrawResponse(socket, data);
    });

    // Disconnection event
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Handle player joining matchmaking queue
   * @param {Object} socket - Socket instance
   * @param {Object} playerData - Player information
   */
  handleJoinQueue(socket, playerData) {
    try {
      const player = {
        id: socket.id,
        name: sanitizePlayerName(playerData.name) || `Player ${socket.id.substring(0, 6)}`,
        rating: playerData.rating || 1200,
        socketId: socket.id
      };

      // Store player connection
      this.connectedPlayers.set(socket.id, player);
      this.playerSockets.set(player.id, socket.id);

      // Join matchmaking queue
      const result = gameService.joinMatchmakingQueue(player);

      if (result.gameId) {
        // Game was created
        this.notifyGameStart(result);
      } else {
        // Added to queue
        socket.emit(SOCKET_EVENTS.QUEUE_JOINED, {
          position: result.queuePosition,
          estimatedWaitTime: result.estimatedWaitTime
        });
      }

      logger.info('Player joined queue', { 
        playerId: player.id, 
        playerName: player.name 
      });
    } catch (error) {
      logger.error('Error joining queue', { 
        error: error.message, 
        socketId: socket.id 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to join queue')
      );
    }
  }

  /**
   * Handle player move
   * @param {Object} socket - Socket instance
   * @param {Object} data - Move data
   */
  handleMakeMove(socket, data) {
    try {
      const { gameId, move } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      const result = gameService.makeMove(gameId, player.id, move);

      if (result.error) {
        socket.emit(SOCKET_EVENTS.INVALID_MOVE, 
          formatResponse(false, null, result.error)
        );
        return;
      }

      // Broadcast move to all players in the game
      this.broadcastToGame(gameId, SOCKET_EVENTS.MOVE_MADE, {
        move: result.move,
        gameState: result.gameState
      });

      // Check for game end
      if (result.gameState.isGameOver) {
        this.broadcastToGame(gameId, SOCKET_EVENTS.GAME_ENDED, {
          reason: result.gameState.status,
          winner: result.gameState.winner,
          gameState: result.gameState
        });
      }

      logger.info('Move made', { 
        gameId, 
        playerId: player.id, 
        move: result.move.san 
      });
    } catch (error) {
      logger.error('Error making move', { 
        error: error.message, 
        socketId: socket.id, 
        data 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to make move')
      );
    }
  }

  /**
   * Handle chat message
   * @param {Object} socket - Socket instance
   * @param {Object} data - Chat data
   */
  handleChatMessage(socket, data) {
    try {
      const { gameId, message } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      const sanitizedMessage = sanitizeChatMessage(message);
      if (!sanitizedMessage) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, ERROR_MESSAGES.CHAT_MESSAGE_TOO_LONG)
        );
        return;
      }

      const result = gameService.addChatMessage(gameId, player.id, sanitizedMessage);

      if (result.error) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, result.error)
        );
        return;
      }

      // Broadcast message to all players in the game
      this.broadcastToGame(gameId, SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, result.message);

      logger.debug('Chat message sent', { 
        gameId, 
        playerId: player.id, 
        messageLength: sanitizedMessage.length 
      });
    } catch (error) {
      logger.error('Error sending chat message', { 
        error: error.message, 
        socketId: socket.id, 
        data 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to send message')
      );
    }
  }

  /**
   * Handle game resignation
   * @param {Object} socket - Socket instance
   * @param {Object} data - Resignation data
   */
  handleResign(socket, data) {
    try {
      const { gameId } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      const game = gameService.getGame(gameId);
      if (!game) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, ERROR_MESSAGES.GAME_NOT_FOUND)
        );
        return;
      }

      // Determine winner (opponent of resigning player)
      const winner = game.white === player.id ? game.black : game.white;

      // Broadcast resignation to all players
      this.broadcastToGame(gameId, SOCKET_EVENTS.GAME_ENDED, {
        reason: 'resignation',
        winner,
        resignedPlayer: player.id
      });

      // Remove game
      gameService.leaveGame(gameId, player.id);

      logger.info('Player resigned', { gameId, playerId: player.id });
    } catch (error) {
      logger.error('Error handling resignation', { 
        error: error.message, 
        socketId: socket.id, 
        data 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to resign')
      );
    }
  }

  /**
   * Handle draw request
   * @param {Object} socket - Socket instance
   * @param {Object} data - Draw request data
   */
  handleDrawRequest(socket, data) {
    try {
      const { gameId } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      const game = gameService.getGame(gameId);
      if (!game) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, ERROR_MESSAGES.GAME_NOT_FOUND)
        );
        return;
      }

      // Find opponent
      const opponentId = game.white === player.id ? game.black : game.white;
      const opponentSocketId = this.playerSockets.get(opponentId);

      if (opponentSocketId) {
        this.io.to(opponentSocketId).emit(SOCKET_EVENTS.DRAW_OFFERED, {
          gameId,
          fromPlayer: player.id,
          fromPlayerName: player.name
        });
      }

      logger.info('Draw offer sent', { gameId, fromPlayer: player.id, toPlayer: opponentId });
    } catch (error) {
      logger.error('Error handling draw request', { 
        error: error.message, 
        socketId: socket.id, 
        data 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to request draw')
      );
    }
  }

  /**
   * Handle draw response
   * @param {Object} socket - Socket instance
   * @param {Object} data - Draw response data
   */
  handleDrawResponse(socket, data) {
    try {
      const { gameId, accepted } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      if (accepted) {
        // Draw accepted - end game
        this.broadcastToGame(gameId, SOCKET_EVENTS.GAME_ENDED, {
          reason: 'draw',
          agreed: true
        });

        // Remove game
        gameService.leaveGame(gameId, player.id);

        logger.info('Draw accepted', { gameId, playerId: player.id });
      } else {
        // Draw declined
        const game = gameService.getGame(gameId);
        const opponentId = game.white === player.id ? game.black : game.white;
        const opponentSocketId = this.playerSockets.get(opponentId);

        if (opponentSocketId) {
          this.io.to(opponentSocketId).emit(SOCKET_EVENTS.DRAW_DECLINED, {
            gameId,
            fromPlayer: player.id
          });
        }

        logger.info('Draw declined', { gameId, playerId: player.id });
      }
    } catch (error) {
      logger.error('Error handling draw response', { 
        error: error.message, 
        socketId: socket.id, 
        data 
      });
      
      socket.emit(SOCKET_EVENTS.ERROR, 
        formatResponse(false, null, 'Failed to respond to draw')
      );
    }
  }

  /**
   * Handle player disconnection
   * @param {Object} socket - Socket instance
   */
  handleDisconnection(socket) {
    try {
      const player = this.connectedPlayers.get(socket.id);
      
      if (player) {
        logger.info('User disconnected', { 
          socketId: socket.id, 
          playerId: player.id 
        });

        // Find and handle games this player was in
        // In a production system, you might want to give them time to reconnect
        // For now, we'll immediately end their games
        this.handlePlayerGamesOnDisconnect(player);

        // Remove from tracking
        this.connectedPlayers.delete(socket.id);
        this.playerSockets.delete(player.id);
      } else {
        logger.info('Unknown user disconnected', { socketId: socket.id });
      }
    } catch (error) {
      logger.error('Error handling disconnection', { 
        error: error.message, 
        socketId: socket.id 
      });
    }
  }

  /**
   * Handle player games when they disconnect
   * @param {Object} player - Player data
   */
  handlePlayerGamesOnDisconnect(player) {
    try {
      // This is a simplified approach - in production you might want to:
      // 1. Mark player as temporarily disconnected
      // 2. Give them time to reconnect
      // 3. Only end game after a timeout
      
      // For now, we'll just notify opponents of disconnection
      // The game service will handle cleanup through its own mechanisms
      
      logger.info('Handling disconnected player games', { playerId: player.id });
    } catch (error) {
      logger.error('Error handling player games on disconnect', { 
        error: error.message, 
        playerId: player.id 
      });
    }
  }

  /**
   * Notify players when a game starts
   * @param {Object} gameData - Game data
   */
  notifyGameStart(gameData) {
    try {
      const { players } = gameData;
      
      players.forEach(player => {
        const socketId = this.playerSockets.get(player.id);
        if (socketId) {
          this.io.to(socketId).emit(SOCKET_EVENTS.GAME_STARTED, {
            gameId: gameData.id,
            color: player.color,
            opponent: players.find(p => p.id !== player.id),
            gameState: gameData
          });
        }
      });

      logger.info('Game start notifications sent', { 
        gameId: gameData.id,
        playerCount: players.length 
      });
    } catch (error) {
      logger.error('Error notifying game start', { 
        error: error.message, 
        gameData 
      });
    }
  }

  /**
   * Broadcast message to all players in a game
   * @param {string} gameId - Game identifier
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcastToGame(gameId, event, data) {
    try {
      const game = gameService.getGame(gameId);
      if (!game) {
        return;
      }

      game.playersList.forEach(player => {
        const socketId = this.playerSockets.get(player.id);
        if (socketId) {
          this.io.to(socketId).emit(event, data);
        }
      });

      logger.debug('Broadcast to game', { gameId, event, playerCount: game.playersList.length });
    } catch (error) {
      logger.error('Error broadcasting to game', { 
        error: error.message, 
        gameId, 
        event 
      });
    }
  }

  /**
   * Get connected players count
   * @returns {number} Number of connected players
   */
  getConnectedPlayersCount() {
    return this.connectedPlayers.size;
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    return {
      connectedPlayers: this.connectedPlayers.size,
      totalSockets: this.io.engine.clientsCount
    };
  }
}

module.exports = SocketService;

