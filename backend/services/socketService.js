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
const jwt = require('jsonwebtoken');
const config = require('../config');

// Get matchmaking service instance
let matchmakingService;
try {
  matchmakingService = require('./matchmakingService');
} catch (error) {
  logger.error('Failed to load matchmaking service', { error: error.message });
}

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedPlayers = new Map(); // socketId -> playerData
    this.playerSockets = new Map(); // playerId -> socketId
    
    this.setupEventHandlers();
    
    // Register this socket service with matchmaking service for callbacks
    if (matchmakingService && typeof matchmakingService.setSocketService === 'function') {
      matchmakingService.setSocketService(this);
    }
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

    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('Socket connection without token', { socketId: socket.id });
      socket.emit(SOCKET_EVENTS.ERROR, formatResponse(false, null, 'Authentication required'));
      socket.disconnect();
      return;
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;  // JWT contains 'id' not 'userId'
      socket.username = decoded.username;
      
      // Store player data in connectedPlayers Map
      const playerData = {
        id: socket.userId,
        username: socket.username,
        socketId: socket.id
      };
      
      this.connectedPlayers.set(socket.id, playerData);
      this.playerSockets.set(socket.userId, socket.id);
      
      logger.info('Socket authenticated and player stored', { 
        socketId: socket.id, 
        userId: decoded.id, 
        username: decoded.username 
      });
    } catch (error) {
      logger.warn('Socket authentication failed', { 
        socketId: socket.id, 
        error: error.message 
      });
      socket.emit(SOCKET_EVENTS.ERROR, formatResponse(false, null, 'Invalid authentication token'));
      socket.disconnect();
      return;
    }

    // Join queue event
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (playerData) => {
      logger.info('JOIN_QUEUE event received', { 
        socketId: socket.id, 
        userId: socket.userId, 
        playerData 
      });
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
  async handleJoinQueue(socket, playerData) {
    try {
      if (!socket.userId) {
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Authentication required')
        );
        return;
      }

      const queueData = {
        game_type: playerData.gameType || 'rapid',
        time_control: playerData.timeControl || '10+0',
        rating_range: playerData.ratingRange || null
      };

      // Store socket connection mapping
      this.playerSockets.set(socket.userId, socket.id);
      
      logger.info('User joining queue', { 
        userId: socket.userId, 
        username: socket.username,
        gameType: queueData.game_type,
        playerData: playerData
      });

      // Join matchmaking queue using the correct service
      const result = await matchmakingService.joinQueue(socket.userId, queueData);

      logger.info('Queue join result', { 
        userId: socket.userId,
        result: result,
        hasGame: !!result.game
      });

      if (result.game) {
        // Game was created immediately (found match)
        logger.info('Match found - notifying players', { 
          gameId: result.game.id,
          userId: socket.userId 
        });
        this.notifyGameStart(result.game);
      } else {
        // Added to queue successfully
        logger.info('Player added to queue', { 
          userId: socket.userId,
          position: result.position
        });
        
        socket.emit(SOCKET_EVENTS.QUEUE_JOINED, {
          position: result.position,
          estimatedWaitTime: result.estimatedWaitTime,
          message: result.message
        });
      }

      logger.info('Player joined queue successfully', { 
        userId: socket.userId, 
        username: socket.username,
        position: result.position 
      });
    } catch (error) {
      logger.error('Error joining queue', { 
        error: error.message, 
        userId: socket.userId,
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
  async handleMakeMove(socket, data) {
    try {
      console.log('🎯 Received make-move:', data);
      const { gameId, move } = data;
      const player = this.connectedPlayers.get(socket.id);
      
      if (!player) {
        console.log('❌ Player not found in connectedPlayers:', socket.id);
        socket.emit(SOCKET_EVENTS.ERROR, 
          formatResponse(false, null, 'Player not found')
        );
        return;
      }

      console.log('🎮 Processing move for player:', player.id, 'game:', gameId);
      const result = await gameService.makeMove(gameId, player.id, { move });

      if (result.error) {
        console.log('❌ Move error:', result.error);
        socket.emit(SOCKET_EVENTS.INVALID_MOVE, 
          formatResponse(false, null, result.error)
        );
        return;
      }

      console.log('✅ Move successful, broadcasting to game');
      // Broadcast move to all players in the game
      this.broadcastToGame(gameId, SOCKET_EVENTS.MOVE_MADE, {
        move: result.move,
        gameState: result.gameState
      });

      // Check for game end
      if (result.gameState && result.gameState.isGameOver) {
        this.broadcastToGame(gameId, SOCKET_EVENTS.GAME_ENDED, {
          reason: result.gameState.status,
          winner: result.gameState.winner,
          gameState: result.gameState
        });
      }

      logger.info('Move made successfully', { 
        gameId, 
        playerId: player.id, 
        move: result.move?.san 
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
          playerId: player.id,
          username: player.username
        });

        // Remove from tracking
        this.connectedPlayers.delete(socket.id);
        this.playerSockets.delete(player.id);
        
        // Handle player games on disconnect
        this.handlePlayerGamesOnDisconnect(player);
      } else {
        // Still remove from playerSockets if we have the userId
        if (socket.userId) {
          this.playerSockets.delete(socket.userId);
          logger.info('Disconnected user cleaned up', { 
            socketId: socket.id, 
            userId: socket.userId 
          });
        } else {
          logger.info('Unknown user disconnected', { socketId: socket.id });
        }
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
      logger.info('notifyGameStart called with data', { 
        gameId: gameData.id,
        players: gameData.players,
        playerCount: gameData.players?.length,
        playerSocketMappings: Array.from(this.playerSockets.entries())
      });

      const { players } = gameData;
      
      if (!players || !Array.isArray(players)) {
        logger.error('Game data missing players array', { gameData });
        return;
      }

      players.forEach(player => {
        const socketId = this.playerSockets.get(player.user_id || player.id || player.userId);
        logger.info('Looking for socket for player', { 
          playerId: player.user_id || player.id || player.userId,
          socketId,
          playerData: player
        });
        
        if (socketId) {
          this.io.to(socketId).emit(SOCKET_EVENTS.GAME_STARTED, {
            gameId: gameData.id,
            color: player.color,
            opponent: players.find(p => (p.user_id || p.id || p.userId) !== (player.user_id || player.id || player.userId)),
            gameState: gameData
          });
          
          logger.info('Game start notification sent', { 
            playerId: player.user_id || player.id || player.userId,
            socketId,
            gameId: gameData.id
          });
        } else {
          logger.warn('No socket found for player', { 
            playerId: player.user_id || player.id || player.userId
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
  async broadcastToGame(gameId, event, data) {
    try {
      console.log('📡 Broadcasting to game:', gameId, 'event:', event);
      
      // Get game from database instead of in-memory service
      const game = await gameService.getGameById(gameId);
      if (!game || !game.players) {
        logger.warn('Game not found for broadcast', { gameId });
        return;
      }

      console.log('📡 Found game with players:', game.players.map(p => p.user_id));

      game.players.forEach(player => {
        const socketId = this.playerSockets.get(player.user_id);
        console.log('📡 Player:', player.user_id, 'socketId:', socketId);
        
        if (socketId) {
          this.io.to(socketId).emit(event, data);
          console.log('📡 Sent to player:', player.user_id);
        } else {
          console.log('❌ No socket for player:', player.user_id);
        }
      });

      logger.info('Broadcast completed', { 
        gameId, 
        event, 
        playerCount: game.players.length 
      });
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

