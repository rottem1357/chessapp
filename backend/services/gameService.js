/**
 * Game Service
 * Handles multiplayer game logic and state management
 */

const { Chess } = require('chess.js');
const { 
  GAME_STATUS, 
  COLORS, 
  ERROR_MESSAGES,
  DEFAULT_RATING,
  BOARD 
} = require('../utils/constants');
const { 
  generateGameId, 
  generatePlayerId,
  getCurrentTimestamp,
  sanitizePlayerName 
} = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config');

class GameService {
  constructor() {
    this.games = new Map();
    this.waitingPlayers = [];
    this.maxGames = config.game.maxGames;
    this.gameTimeout = config.game.gameTimeout;
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new multiplayer game
   * @param {Object} playerData - Player information
   * @returns {Object} Created game data
   */
  createGame(playerData = {}) {
    try {
      if (this.games.size >= this.maxGames) {
        throw new Error('Maximum number of games reached');
      }

      const gameId = generateGameId();
      const chess = new Chess();
      
      const game = {
        id: gameId,
        chess,
        players: [],
        white: null,
        black: null,
        status: GAME_STATUS.WAITING,
        fen: chess.fen(),
        moves: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        spectators: [],
        chatMessages: []
      };

      this.games.set(gameId, game);
      
      logger.info('Created new multiplayer game', { gameId });
      
      return this.formatGameResponse(game);
    } catch (error) {
      logger.error('Error creating game', { error: error.message, playerData });
      throw error;
    }
  }

  /**
   * Join a game or matchmaking queue
   * @param {string} gameId - Game ID to join (optional)
   * @param {Object} playerData - Player information
   * @returns {Object} Join result
   */
  joinGame(gameId = null, playerData = {}) {
    try {
      const player = this.createPlayer(playerData);
      
      if (gameId) {
        // Join specific game
        const game = this.games.get(gameId);
        if (!game) {
          return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
        }
        
        if (game.players.length >= 2) {
          return { error: 'Game is full' };
        }
        
        return this.addPlayerToGame(game, player);
      } else {
        // Join matchmaking queue
        return this.joinMatchmakingQueue(player);
      }
    } catch (error) {
      logger.error('Error joining game', { error: error.message, gameId, playerData });
      throw error;
    }
  }

  /**
   * Leave a game
   * @param {string} gameId - Game identifier
   * @param {string} playerId - Player identifier
   * @returns {Object} Leave result
   */
  leaveGame(gameId, playerId) {
    try {
      const game = this.games.get(gameId);
      if (!game) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        return { error: ERROR_MESSAGES.PLAYER_NOT_IN_GAME };
      }

      // Remove player from game
      game.players.splice(playerIndex, 1);
      
      // Update game status
      if (game.status === GAME_STATUS.ACTIVE) {
        game.status = GAME_STATUS.ABANDONED;
      }
      
      game.lastActivity = new Date();
      
      logger.info('Player left game', { gameId, playerId });
      
      // If no players left, delete the game
      if (game.players.length === 0) {
        this.games.delete(gameId);
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Error leaving game', { error: error.message, gameId, playerId });
      throw error;
    }
  }

  /**
   * Make a move in a game
   * @param {string} gameId - Game identifier
   * @param {string} playerId - Player identifier
   * @param {string|Object} move - Move to make
   * @returns {Object} Move result
   */
  makeMove(gameId, playerId, move) {
    try {
      const game = this.games.get(gameId);
      if (!game) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      if (game.status !== GAME_STATUS.ACTIVE) {
        return { error: ERROR_MESSAGES.INVALID_GAME_STATE };
      }

      if (game.chess.isGameOver()) {
        return { error: ERROR_MESSAGES.GAME_ALREADY_OVER };
      }

      // Validate player is in game and it's their turn
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        return { error: ERROR_MESSAGES.PLAYER_NOT_IN_GAME };
      }

      const currentTurn = game.chess.turn();
      const playerColor = player.color;
      const playerTurn = playerColor === COLORS.WHITE ? 'w' : 'b';

      if (currentTurn !== playerTurn) {
        return { error: ERROR_MESSAGES.NOT_YOUR_TURN };
      }

      // Make the move
      let moveResult;
      try {
        moveResult = game.chess.move(move);
        if (!moveResult) {
          return { error: ERROR_MESSAGES.INVALID_MOVE };
        }
      } catch (error) {
        return { error: ERROR_MESSAGES.INVALID_MOVE };
      }

      // Update game state
      game.fen = game.chess.fen();
      game.lastActivity = new Date();
      
      // Add move to history
      const moveData = {
        ...moveResult,
        playerId,
        playerName: player.name,
        timestamp: getCurrentTimestamp()
      };
      game.moves.push(moveData);

      // Check for game end
      if (game.chess.isGameOver()) {
        game.status = this.getGameEndStatus(game.chess);
        if (game.chess.isCheckmate()) {
          game.winner = game.chess.turn() === 'w' ? COLORS.BLACK : COLORS.WHITE;
        }
      }

      logger.info('Move made', { 
        gameId, 
        playerId, 
        move: moveResult.san,
        gameStatus: game.status 
      });

      return {
        move: moveData,
        gameState: this.formatGameResponse(game)
      };
    } catch (error) {
      logger.error('Error making move', { 
        error: error.message, 
        gameId, 
        playerId, 
        move 
      });
      throw error;
    }
  }

  /**
   * Add chat message to game
   * @param {string} gameId - Game identifier
   * @param {string} playerId - Player identifier
   * @param {string} message - Chat message
   * @returns {Object} Message result
   */
  addChatMessage(gameId, playerId, message) {
    try {
      const game = this.games.get(gameId);
      if (!game) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        return { error: ERROR_MESSAGES.PLAYER_NOT_IN_GAME };
      }

      const chatMessage = {
        id: generateGameId(),
        playerId,
        playerName: player.name,
        message,
        timestamp: getCurrentTimestamp()
      };

      game.chatMessages.push(chatMessage);
      game.lastActivity = new Date();

      // Keep only last 100 messages
      if (game.chatMessages.length > 100) {
        game.chatMessages = game.chatMessages.slice(-100);
      }

      logger.debug('Chat message added', { gameId, playerId, message });

      return { message: chatMessage };
    } catch (error) {
      logger.error('Error adding chat message', { 
        error: error.message, 
        gameId, 
        playerId 
      });
      throw error;
    }
  }

  /**
   * Get game by ID
   * @param {string} gameId - Game identifier
   * @returns {Object|null} Game data or null
   */
  getGame(gameId) {
    const game = this.games.get(gameId);
    return game ? this.formatGameResponse(game) : null;
  }

  /**
   * Get active games list
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Games list with pagination
   */
  getActiveGames(page = 1, limit = 10) {
    const games = Array.from(this.games.values())
      .filter(game => game.status === GAME_STATUS.ACTIVE || game.status === GAME_STATUS.WAITING)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGames = games.slice(startIndex, endIndex);

    return {
      games: paginatedGames.map(game => this.formatGameResponse(game, false)),
      pagination: {
        page,
        limit,
        total: games.length,
        pages: Math.ceil(games.length / limit)
      }
    };
  }

  /**
   * Get game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    const totalGames = this.games.size;
    const activeGames = Array.from(this.games.values())
      .filter(game => game.status === GAME_STATUS.ACTIVE).length;
    const waitingGames = Array.from(this.games.values())
      .filter(game => game.status === GAME_STATUS.WAITING).length;

    return {
      totalGames,
      activeGames,
      waitingGames,
      waitingPlayers: this.waitingPlayers.length,
      maxGames: this.maxGames
    };
  }

  /**
   * Join matchmaking queue
   * @param {Object} player - Player data
   * @returns {Object} Queue result
   */
  joinMatchmakingQueue(player) {
    // Remove player if already in queue
    this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== player.id);
    
    // Add to queue
    this.waitingPlayers.push(player);
    
    logger.info('Player joined matchmaking queue', { 
      playerId: player.id, 
      queueLength: this.waitingPlayers.length 
    });

    // Try to match players
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift();
      const player2 = this.waitingPlayers.shift();
      
      return this.createMatchedGame(player1, player2);
    }

    return {
      queuePosition: this.waitingPlayers.length,
      estimatedWaitTime: this.estimateWaitTime()
    };
  }

  /**
   * Create a matched game from queue
   * @param {Object} player1 - First player
   * @param {Object} player2 - Second player
   * @returns {Object} Created game
   */
  createMatchedGame(player1, player2) {
    const game = this.createGame();
    
    // Randomly assign colors
    const player1IsWhite = Math.random() > 0.5;
    
    player1.color = player1IsWhite ? COLORS.WHITE : COLORS.BLACK;
    player2.color = player1IsWhite ? COLORS.BLACK : COLORS.WHITE;
    
    game.players = [player1, player2];
    game.white = player1IsWhite ? player1.id : player2.id;
    game.black = player1IsWhite ? player2.id : player1.id;
    game.status = GAME_STATUS.ACTIVE;
    
    const gameData = this.games.get(game.id);
    gameData.players = [player1, player2];
    gameData.white = game.white;
    gameData.black = game.black;
    gameData.status = GAME_STATUS.ACTIVE;

    logger.info('Created matched game', { 
      gameId: game.id, 
      player1: player1.id, 
      player2: player2.id 
    });

    return this.formatGameResponse(gameData);
  }

  /**
   * Add player to existing game
   * @param {Object} game - Game instance
   * @param {Object} player - Player data
   * @returns {Object} Join result
   */
  addPlayerToGame(game, player) {
    if (game.players.length >= 2) {
      return { error: 'Game is full' };
    }

    // Assign color
    if (game.players.length === 0) {
      player.color = Math.random() > 0.5 ? COLORS.WHITE : COLORS.BLACK;
      game.white = player.color === COLORS.WHITE ? player.id : null;
      game.black = player.color === COLORS.BLACK ? player.id : null;
    } else {
      const existingPlayer = game.players[0];
      player.color = existingPlayer.color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      
      if (player.color === COLORS.WHITE) {
        game.white = player.id;
      } else {
        game.black = player.id;
      }
    }

    game.players.push(player);
    
    // Start game if both players present
    if (game.players.length === 2) {
      game.status = GAME_STATUS.ACTIVE;
    }
    
    game.lastActivity = new Date();

    logger.info('Player joined game', { 
      gameId: game.id, 
      playerId: player.id, 
      playerCount: game.players.length 
    });

    return this.formatGameResponse(game);
  }

  /**
   * Create player object
   * @param {Object} playerData - Raw player data
   * @returns {Object} Formatted player object
   */
  createPlayer(playerData = {}) {
    return {
      id: playerData.id || generatePlayerId(),
      name: sanitizePlayerName(playerData.name) || `Player ${Date.now()}`,
      rating: playerData.rating || DEFAULT_RATING,
      color: null,
      joinedAt: new Date()
    };
  }

  /**
   * Get game end status
   * @param {Chess} chess - Chess instance
   * @returns {string} Game status
   */
  getGameEndStatus(chess) {
    if (chess.isCheckmate()) {
      return GAME_STATUS.CHECKMATE;
    }
    if (chess.isStalemate()) {
      return GAME_STATUS.STALEMATE;
    }
    if (chess.isDraw()) {
      return GAME_STATUS.DRAW;
    }
    return GAME_STATUS.FINISHED;
  }

  /**
   * Format game response
   * @param {Object} game - Game instance
   * @param {boolean} includeDetails - Include detailed information
   * @returns {Object} Formatted game data
   */
  formatGameResponse(game, includeDetails = true) {
    const baseData = {
      id: game.id,
      status: game.status,
      players: game.players.length,
      createdAt: game.createdAt,
      lastActivity: game.lastActivity
    };

    if (!includeDetails) {
      return baseData;
    }

    return {
      ...baseData,
      playersList: game.players,
      white: game.white,
      black: game.black,
      fen: game.fen,
      turn: game.chess.turn(),
      moves: game.moves,
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isStalemate: game.chess.isStalemate(),
      isDraw: game.chess.isDraw(),
      isGameOver: game.chess.isGameOver(),
      chatMessages: game.chatMessages,
      winner: game.winner || null
    };
  }

  /**
   * Estimate wait time in queue
   * @returns {number} Estimated wait time in seconds
   */
  estimateWaitTime() {
    // Simple estimation based on queue length
    const queueLength = this.waitingPlayers.length;
    return Math.max(30, queueLength * 15); // 30 seconds minimum, +15 seconds per player
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldGames();
    }, this.gameTimeout / 2); // Run cleanup every half timeout period
  }

  /**
   * Cleanup old games
   */
  cleanupOldGames() {
    const now = Date.now();
    
    for (const [gameId, game] of this.games) {
      const timeSinceActivity = now - game.lastActivity.getTime();
      
      if (timeSinceActivity > this.gameTimeout) {
        this.games.delete(gameId);
        logger.info('Cleaned up old game', { gameId, timeSinceActivity });
      }
    }

    // Clean up old waiting players
    this.waitingPlayers = this.waitingPlayers.filter(player => {
      const timeSinceJoin = now - player.joinedAt.getTime();
      return timeSinceJoin < this.gameTimeout;
    });
  }
}

// Create singleton instance
const gameService = new GameService();

module.exports = gameService;
