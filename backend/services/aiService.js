/**
 * AI Service
 * Provides AI opponent functionality for chess games
 */

const { Chess } = require('chess.js');
const { 
  AI_DIFFICULTIES, 
  ERROR_MESSAGES, 
  GAME_STATUS, 
  COLORS, 
  PIECE_VALUES 
} = require('../utils/constants');
const { 
  generateGameId, 
  getCurrentTimestamp, 
  sleep 
} = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config');

class AIService {
  constructor() {
    this.aiGames = new Map();
    this.maxConcurrentGames = config.ai.maxConcurrentGames;
    this.defaultDifficulty = config.ai.defaultDifficulty;
    this.maxThinkingTime = config.ai.maxThinkingTime;
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new AI game
   * @param {string} difficulty - AI difficulty level
   * @param {string} playerColor - Player's color choice
   * @param {string} playerId - Player identifier
   * @returns {Promise<Object>} Game data
   */
  async createGame(difficulty = this.defaultDifficulty, playerColor = COLORS.WHITE, playerId = null) {
    try {
      // Check if we can create more games
      if (this.aiGames.size >= this.maxConcurrentGames) {
        throw new Error(ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE);
      }

      const gameId = generateGameId();
      const chess = new Chess();
      
      const game = {
        id: gameId,
        chess,
        difficulty,
        playerColor,
        playerId,
        aiColor: playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE,
        status: GAME_STATUS.ACTIVE,
        createdAt: new Date(),
        lastActivity: new Date(),
        moves: []
      };
      
      logger.info('Creating AI game', { 
        gameId, 
        difficulty, 
        playerColor, 
        playerId 
      });
      
      this.aiGames.set(gameId, game);
      
      // If AI plays white, make first move
      let aiMove = null;
      if (game.aiColor === COLORS.WHITE) {
        try {
          aiMove = await this.generateMove(gameId);
          if (aiMove) {
            game.moves.push({
              ...aiMove,
              player: 'ai',
              timestamp: getCurrentTimestamp()
            });
          }
        } catch (error) {
          logger.error('Error generating AI opening move', { 
            gameId, 
            error: error.message 
          });
        }
      }
      
      return {
        id: gameId,
        difficulty,
        playerColor,
        aiColor: game.aiColor,
        fen: chess.fen(),
        turn: chess.turn(),
        status: chess.isGameOver() ? GAME_STATUS.FINISHED : GAME_STATUS.ACTIVE,
        aiMove,
        moves: game.moves,
        gameState: this.getGameState(gameId)
      };
    } catch (error) {
      logger.error('Error creating AI game', { 
        difficulty, 
        playerColor, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get current game state
   * @param {string} gameId - Game identifier
   * @returns {Object|null} Game state or null if not found
   */
  getGameState(gameId) {
    const game = this.aiGames.get(gameId);
    if (!game) {
      return null;
    }

    return {
      id: gameId,
      difficulty: game.difficulty,
      playerColor: game.playerColor,
      aiColor: game.aiColor,
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      status: game.chess.isGameOver() ? GAME_STATUS.FINISHED : GAME_STATUS.ACTIVE,
      moves: game.moves,
      gameOver: game.chess.isGameOver(),
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isStalemate: game.chess.isStalemate(),
      isDraw: game.chess.isDraw(),
      lastActivity: game.lastActivity
    };
  }

  /**
   * Make a move in the game
   * @param {string} gameId - Game identifier
   * @param {string|Object} move - Move to make
   * @returns {Promise<Object>} Move result
   */
  async makeMove(gameId, move) {
    try {
      const game = this.aiGames.get(gameId);
      if (!game) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      if (game.chess.isGameOver()) {
        return { error: ERROR_MESSAGES.GAME_ALREADY_OVER };
      }

      // Validate it's player's turn
      const currentTurn = game.chess.turn();
      const playerTurn = game.playerColor === COLORS.WHITE ? 'w' : 'b';
      
      if (currentTurn !== playerTurn) {
        return { error: ERROR_MESSAGES.NOT_YOUR_TURN };
      }

      // Make player move
      let playerMove;
      try {
        playerMove = game.chess.move(move);
        if (!playerMove) {
          return { error: ERROR_MESSAGES.INVALID_MOVE };
        }
      } catch (error) {
        return { error: ERROR_MESSAGES.INVALID_MOVE };
      }

      // Update game activity
      game.lastActivity = new Date();
      
      // Add move to history
      game.moves.push({
        from: playerMove.from,
        to: playerMove.to,
        san: playerMove.san,
        player: 'human',
        timestamp: getCurrentTimestamp()
      });

      // Check if game is over after player move
      if (game.chess.isGameOver()) {
        game.status = this.getGameEndStatus(game.chess);
        
        return {
          playerMove: {
            from: playerMove.from,
            to: playerMove.to,
            san: playerMove.san
          },
          gameState: this.getGameState(gameId),
          moves: game.moves
        };
      }

      // Generate AI response
      let aiMove = null;
      try {
        aiMove = await this.generateMove(gameId);
        if (aiMove) {
          game.moves.push({
            ...aiMove,
            player: 'ai',
            timestamp: getCurrentTimestamp()
          });
        }
      } catch (error) {
        logger.error('Error generating AI move', { 
          gameId, 
          error: error.message 
        });
        return { error: 'Failed to generate AI move' };
      }

      return {
        playerMove: {
          from: playerMove.from,
          to: playerMove.to,
          san: playerMove.san
        },
        aiMove: aiMove ? {
          from: aiMove.from,
          to: aiMove.to,
          san: aiMove.san
        } : null,
        gameState: this.getGameState(gameId),
        moves: game.moves
      };
    } catch (error) {
      logger.error('Error making move', { 
        gameId, 
        move, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate AI move for current position
   * @param {string} gameId - Game identifier
   * @returns {Promise<Object|null>} AI move or null
   */
  async generateMove(gameId) {
    try {
      const game = this.aiGames.get(gameId);
      if (!game) {
        throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
      }

      const config = this.getDifficultyConfig(game.difficulty);
      
      // Simulate thinking time
      await sleep(config.moveTime);
      
      let bestMove;
      
      switch (game.difficulty) {
        case AI_DIFFICULTIES.BEGINNER:
          bestMove = this.getRandomMove(game.chess);
          break;
        case AI_DIFFICULTIES.INTERMEDIATE:
          bestMove = this.getBasicMove(game.chess);
          break;
        case AI_DIFFICULTIES.ADVANCED:
          bestMove = this.getTacticalMove(game.chess);
          break;
        case AI_DIFFICULTIES.EXPERT:
          bestMove = this.getStrategicMove(game.chess);
          break;
        default:
          bestMove = this.getBasicMove(game.chess);
      }

      if (!bestMove) {
        return null;
      }

      // Make the move
      const move = game.chess.move(bestMove);
      if (!move) {
        return null;
      }

      return {
        from: move.from,
        to: move.to,
        san: move.san,
        uci: bestMove
      };
    } catch (error) {
      logger.error('Error generating AI move', { 
        gameId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Evaluate current position
   * @param {string} gameId - Game identifier
   * @returns {Promise<Object>} Position evaluation
   */
  async evaluatePosition(gameId) {
    try {
      const game = this.aiGames.get(gameId);
      if (!game) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      // Simple evaluation - in a real implementation, this would use
      // a proper chess engine evaluation
      const evaluation = {
        score: 0,
        advantage: 'equal',
        description: 'Position evaluation not available in simple AI mode'
      };

      return evaluation;
    } catch (error) {
      logger.error('Error evaluating position', { 
        gameId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * End AI game and cleanup
   * @param {string} gameId - Game identifier
   * @returns {Object} Result object
   */
  async endGame(gameId) {
    try {
      if (!this.aiGames.has(gameId)) {
        return { error: ERROR_MESSAGES.GAME_NOT_FOUND };
      }

      this.aiGames.delete(gameId);
      
      logger.info('AI game ended', { gameId });
      
      return { success: true };
    } catch (error) {
      logger.error('Error ending AI game', { 
        gameId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get available difficulty levels
   * @returns {Array} Array of difficulty configurations
   */
  getDifficultyLevels() {
    return [
      { 
        value: AI_DIFFICULTIES.BEGINNER, 
        label: 'Beginner', 
        ...this.getDifficultyConfig(AI_DIFFICULTIES.BEGINNER) 
      },
      { 
        value: AI_DIFFICULTIES.INTERMEDIATE, 
        label: 'Intermediate', 
        ...this.getDifficultyConfig(AI_DIFFICULTIES.INTERMEDIATE) 
      },
      { 
        value: AI_DIFFICULTIES.ADVANCED, 
        label: 'Advanced', 
        ...this.getDifficultyConfig(AI_DIFFICULTIES.ADVANCED) 
      },
      { 
        value: AI_DIFFICULTIES.EXPERT, 
        label: 'Expert', 
        ...this.getDifficultyConfig(AI_DIFFICULTIES.EXPERT) 
      }
    ];
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
   * Start cleanup interval for old games
   */
    startCleanupInterval() {
        if (process.env.NODE_ENV !== 'test') {
            setInterval(() => {
                this.cleanupOldGames();
            }, config.ai.cleanupInterval);
        }
    }

  /**
   * Cleanup old games
   */
  cleanupOldGames() {
    const now = Date.now();
    const maxAge = config.game.gameTimeout;
    
    for (const [gameId, game] of this.aiGames) {
      if (now - game.lastActivity.getTime() > maxAge) {
        this.aiGames.delete(gameId);
        logger.info('Cleaned up old AI game', { gameId });
      }
    }
  }

  // AI Move Generation Methods (from the original stockfishService.js)
  // ... (Include all the move generation methods from the original file)
  
  /**
   * Get random move (beginner level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Random move in UCI format
   */
  getRandomMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove.from + randomMove.to + (randomMove.promotion || '');
  }

  /**
   * Get basic move with simple evaluation (intermediate level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getBasicMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      // Heavily favor captures
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
      }
      
      // Favor checks
      chess.move(move);
      if (chess.isCheck()) {
        score += 30;
      }
      chess.undo();
      
      // Favor center control
      if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
        score += 20;
      }
      
      // Favor piece development
      if (move.piece !== 'p' && ['a1', 'a8', 'h1', 'h8'].includes(move.from)) {
        score += 15;
      }
      
      // Add some randomness
      score += Math.random() * 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get tactical move (advanced level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getTacticalMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      chess.move(move);
      
      // Check for checkmate
      if (chess.isCheckmate()) {
        chess.undo();
        return move.from + move.to + (move.promotion || '');
      }
      
      // Heavy penalty for allowing checkmate
      const opponentMoves = chess.moves({ verbose: true });
      let allowsCheckmate = false;
      
      for (const opponentMove of opponentMoves) {
        chess.move(opponentMove);
        if (chess.isCheckmate()) {
          allowsCheckmate = true;
          chess.undo();
          break;
        }
        chess.undo();
      }
      
      if (allowsCheckmate) {
        score -= 1000;
      }
      
      // Check for checks
      if (chess.isCheck()) {
        score += 50;
      }
      
      // Evaluate captures
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
        
        // Bonus for capturing higher value pieces
        if (this.getPieceValue(move.captured) > this.getPieceValue(move.piece)) {
          score += 20;
        }
      }
      
      chess.undo();
      
      // Add small random element
      score += Math.random() * 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get strategic move (expert level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getStrategicMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      chess.move(move);
      
      // Checkmate detection
      if (chess.isCheckmate()) {
        chess.undo();
        return move.from + move.to + (move.promotion || '');
      }
      
      // Avoid allowing checkmate
      const opponentMoves = chess.moves({ verbose: true });
      let allowsCheckmate = false;
      
      for (const opponentMove of opponentMoves) {
        chess.move(opponentMove);
        if (chess.isCheckmate()) {
          allowsCheckmate = true;
          chess.undo();
          break;
        }
        chess.undo();
      }
      
      if (allowsCheckmate) {
        score -= 2000;
      }
      
      // Material evaluation
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
      }
      
      // Positional evaluation
      score += this.evaluatePositionScore(chess);
      
      chess.undo();
      
      // Very small random element for variety
      score += Math.random() * 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get piece value
   * @param {string} piece - Piece type
   * @returns {number} Piece value
   */
  getPieceValue(piece) {
    return PIECE_VALUES[piece.toLowerCase()] || 0;
  }

  /**
   * Evaluate position score
   * @param {Chess} chess - Chess instance
   * @returns {number} Position score
   */
  evaluatePositionScore(chess) {
    let score = 0;
    
    // Center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    const board = chess.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const piece = board[i][j];
        
        if (piece) {
          // Center control bonus
          if (centerSquares.includes(square)) {
            score += piece.color === chess.turn() ? 10 : -10;
          }
          
          // Piece development bonus
          if (piece.type !== 'p' && piece.type !== 'k') {
            const isOnBackRank = (piece.color === 'w' && i === 7) || (piece.color === 'b' && i === 0);
            if (!isOnBackRank) {
              score += piece.color === chess.turn() ? 5 : -5;
            }
          }
        }
      }
    }
    
    return score;
  }

  /**
   * Get difficulty configuration
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Configuration object
   */
  getDifficultyConfig(difficulty) {
    const configs = {
      [AI_DIFFICULTIES.BEGINNER]: {
        depth: 1,
        skillLevel: 1,
        moveTime: 500,
        description: 'Random moves, good for absolute beginners'
      },
      [AI_DIFFICULTIES.INTERMEDIATE]: {
        depth: 3,
        skillLevel: 10,
        moveTime: 1000,
        description: 'Basic tactics and piece development'
      },
      [AI_DIFFICULTIES.ADVANCED]: {
        depth: 5,
        skillLevel: 15,
        moveTime: 2000,
        description: 'Tactical patterns and strategic concepts'
      },
      [AI_DIFFICULTIES.EXPERT]: {
        depth: 7,
        skillLevel: 20,
        moveTime: 3000,
        description: 'Deep analysis with strategic understanding'
      }
    };

    return configs[difficulty] || configs[AI_DIFFICULTIES.INTERMEDIATE];
  }
}

// Create singleton instance
const aiService = new AIService();

// Cleanup on process exit
process.on('exit', () => {
  aiService.aiGames.clear();
});

process.on('SIGINT', () => {
  aiService.aiGames.clear();
  process.exit(0);
});

module.exports = aiService;
