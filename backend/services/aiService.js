// services/aiService.js
const { Chess } = require('chess.js');
const db = require('../models');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.difficulties = {
      beginner: { level: 1, estimated_rating: 800, thinking_time: 500 },
      easy: { level: 3, estimated_rating: 1000, thinking_time: 1000 },
      intermediate: { level: 5, estimated_rating: 1400, thinking_time: 2000 },
      hard: { level: 8, estimated_rating: 1800, thinking_time: 3000 },
      expert: { level: 12, estimated_rating: 2200, thinking_time: 4000 },
      master: { level: 15, estimated_rating: 2600, thinking_time: 5000 }
    };
  }

  /**
   * Get available AI difficulties
   */
  getDifficulties() {
    return Object.keys(this.difficulties).map(key => ({
      level: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      estimated_rating: this.difficulties[key].estimated_rating,
      description: this.getDifficultyDescription(key)
    }));
  }

  /**
   * Create a new AI game
   */
  async createAIGame(userId, gameData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const user = await db.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      const difficulty = this.difficulties[gameData.difficulty];
      if (!difficulty) {
        throw new Error('Invalid AI difficulty');
      }

      // Parse time control
      const [minutes, increment] = (gameData.time_control || '10+0').split('+').map(Number);
      const timeLimit = minutes * 60;

      // Determine colors
      let userColor = gameData.user_color || 'random';
      if (userColor === 'random') {
        userColor = Math.random() > 0.5 ? 'white' : 'black';
      }
      const aiColor = userColor === 'white' ? 'black' : 'white';

      // Create game
      const game = await db.Game.create({
        game_type: 'ai',
        time_control: gameData.time_control || '10+0',
        time_limit_seconds: timeLimit,
        increment_seconds: increment,
        is_rated: false, // AI games are typically not rated
        is_private: false,
        ai_difficulty: gameData.difficulty,
        status: 'active',
        started_at: new Date(),
        white_time_remaining: timeLimit * 1000,
        black_time_remaining: timeLimit * 1000
      }, { transaction });

      // Create user player
      const userRating = user[`rating_rapid`]; // Use rapid rating for AI games
      await db.Player.create({
        game_id: game.id,
        user_id: userId,
        color: userColor,
        rating_before: userRating,
        is_ai: false
      }, { transaction });

      // Create AI player
      await db.Player.create({
        game_id: game.id,
        user_id: null,
        color: aiColor,
        rating_before: difficulty.estimated_rating,
        is_ai: true,
        ai_name: `AI ${gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1)}`
      }, { transaction });

      await transaction.commit();
      
      logger.info('AI game created', { 
        gameId: game.id, 
        userId, 
        difficulty: gameData.difficulty,
        userColor 
      });
      
      // If AI plays first (white), make AI move
      let aiMove = null;
      if (aiColor === 'white') {
        aiMove = await this.makeAIMove(game.id);
      }

      const gameResult = await this.getAIGameState(game.id);
      
      return {
        ...gameResult,
        ...(aiMove && { lastAIMove: aiMove })
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create AI game', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get AI game state
   */
  async getAIGameState(gameId) {
    try {
      const game = await db.Game.findByPk(gameId, {
        include: [
          {
            model: db.Player,
            as: 'players',
            include: [{
              model: db.User,
              as: 'user',
              attributes: ['id', 'username', 'display_name', 'rating_rapid']
            }]
          },
          {
            model: db.Move,
            as: 'moves',
            order: [['created_at', 'ASC']],
            limit: 100
          }
        ]
      });

      if (!game) {
        throw new Error('AI game not found');
      }

      if (game.game_type !== 'ai') {
        throw new Error('Not an AI game');
      }

      // Add chess position analysis
      const chess = new Chess(game.current_fen);
      
      return {
        ...game.toJSON(),
        analysis: {
          isCheck: chess.isCheck(),
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
          isGameOver: chess.isGameOver(),
          turn: chess.turn(),
          legalMoves: chess.moves()
        }
      };
    } catch (error) {
      logger.error('Failed to get AI game state', { error: error.message, gameId });
      throw error;
    }
  }

  /**
   * Make a move for the user in AI game
   */
  async makeUserMove(gameId, userId, moveData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const game = await db.Game.findByPk(gameId, {
        include: [{
          model: db.Player,
          as: 'players'
        }],
        transaction
      });

      if (!game) {
        throw new Error('AI game not found');
      }

      if (game.game_type !== 'ai') {
        throw new Error('Not an AI game');
      }

      if (game.status !== 'active') {
        throw new Error('Game is not active');
      }

      const userPlayer = game.players.find(p => p.user_id === userId);
      if (!userPlayer) {
        throw new Error('You are not in this game');
      }

      // Validate turn
      const chess = new Chess(game.current_fen);
      const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
      
      if (userPlayer.color !== currentTurn) {
        throw new Error('It is not your turn');
      }

      // Make the move (reuse game service logic)
      const gameService = require('./gameService');
      const moveResult = await gameService.makeMove(gameId, userId, moveData);

      await transaction.commit();

      // If game is still active and it's AI's turn, make AI move
      const updatedGame = await this.getAIGameState(gameId);
      if (updatedGame.status === 'active') {
        const aiPlayer = updatedGame.players.find(p => p.is_ai);
        const currentTurnAfterMove = new Chess(updatedGame.current_fen).turn() === 'w' ? 'white' : 'black';
        
        if (aiPlayer.color === currentTurnAfterMove) {
          // Make AI move after a short delay
          setTimeout(async () => {
            try {
              await this.makeAIMove(gameId);
            } catch (error) {
              logger.error('Failed to make AI move', { error: error.message, gameId });
            }
          }, this.difficulties[game.ai_difficulty].thinking_time);
        }
      }

      return moveResult;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to make user move in AI game', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Make AI move
   */
  async makeAIMove(gameId) {
    try {
      const game = await db.Game.findByPk(gameId, {
        include: [{
          model: db.Player,
          as: 'players'
        }]
      });

      if (!game || game.status !== 'active') {
        return null;
      }

      const aiPlayer = game.players.find(p => p.is_ai);
      if (!aiPlayer) {
        throw new Error('No AI player found');
      }

      const chess = new Chess(game.current_fen);
      const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
      
      if (aiPlayer.color !== currentTurn) {
        return null; // Not AI's turn
      }

      // Generate AI move
      const aiMove = this.generateAIMove(chess, game.ai_difficulty);
      if (!aiMove) {
        throw new Error('AI could not generate a move');
      }

      // Make the move using game service
      const gameService = require('./gameService');
      
      // Create a temporary user ID for AI moves
      const aiUserId = aiPlayer.user_id || 'ai-' + aiPlayer.id;
      
      // We need to temporarily allow AI moves by modifying the game service
      // For now, let's create the move directly in the database
      const move = chess.move(aiMove);
      if (!move) {
        throw new Error('Invalid AI move generated');
      }

      const moveNumber = Math.ceil((game.move_count + 1) / 2);

      // Record AI move
      await db.Move.create({
        game_id: gameId,
        player_id: aiPlayer.id,
        move_number: moveNumber,
        color: aiPlayer.color,
        san: move.san,
        uci: `${move.from}${move.to}${move.promotion || ''}`,
        from_square: move.from,
        to_square: move.to,
        piece: move.piece,
        captured_piece: move.captured || null,
        promotion_piece: move.promotion || null,
        is_check: chess.isCheck(),
        is_checkmate: chess.isCheckmate(),
        is_castling: move.flags.includes('k') || move.flags.includes('q'),
        is_en_passant: move.flags.includes('e'),
        fen_after: chess.fen(),
        time_spent_ms: this.difficulties[game.ai_difficulty].thinking_time
      });

      // Update game state
      const updateData = {
        current_fen: chess.fen(),
        current_turn: chess.turn() === 'w' ? 'white' : 'black',
        move_count: game.move_count + 1,
        last_move_at: new Date()
      };

      // Check for game end
      if (chess.isGameOver()) {
        updateData.status = 'finished';
        updateData.finished_at = new Date();
        
        if (chess.isCheckmate()) {
          updateData.result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
          updateData.result_reason = 'checkmate';
        } else if (chess.isStalemate()) {
          updateData.result = 'draw';
          updateData.result_reason = 'stalemate';
        } else if (chess.isDraw()) {
          updateData.result = 'draw';
          updateData.result_reason = 'insufficient_material';
        }
      }

      await db.Game.update(updateData, {
        where: { id: gameId }
      });

      logger.info('AI move made', { 
        gameId, 
        move: move.san,
        difficulty: game.ai_difficulty 
      });

      return {
        move: {
          san: move.san,
          uci: `${move.from}${move.to}${move.promotion || ''}`,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          promotion: move.promotion
        }
      };
    } catch (error) {
      logger.error('Failed to make AI move', { error: error.message, gameId });
      throw error;
    }
  }

  /**
   * Generate AI move based on difficulty
   */
  generateAIMove(chess, difficulty) {
    const moves = chess.moves();
    if (moves.length === 0) {
      return null;
    }

    const difficultySettings = this.difficulties[difficulty];
    
    // Simple AI logic based on difficulty
    if (difficultySettings.level <= 3) {
      // Beginner/Easy: Random moves with slight preference for captures
      const captures = chess.moves({ verbose: true }).filter(move => move.captured);
      if (captures.length > 0 && Math.random() > 0.7) {
        return captures[Math.floor(Math.random() * captures.length)].san;
      }
      return moves[Math.floor(Math.random() * moves.length)];
    } else if (difficultySettings.level <= 8) {
      // Intermediate/Hard: Basic tactical awareness
      return this.getBestMoveBasic(chess);
    } else {
      // Expert/Master: Advanced evaluation
      return this.getBestMoveAdvanced(chess);
    }
  }

  /**
   * Basic move evaluation
   */
  getBestMoveBasic(chess) {
    const moves = chess.moves({ verbose: true });
    let bestMove = null;
    let bestScore = -9999;

    for (const move of moves) {
      chess.move(move);
      let score = this.evaluatePosition(chess);
      
      // Prefer captures
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
      }
      
      // Avoid moving into check
      if (chess.inCheck()) {
        score -= 50;
      }

      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move.san;
      }
    }

    return bestMove || moves[0].san;
  }

  /**
   * Advanced move evaluation
   */
  getBestMoveAdvanced(chess) {
    // For now, use the same as basic but with deeper evaluation
    // In a real implementation, you would use a proper chess engine
    return this.getBestMoveBasic(chess);
  }

  /**
   * Simple position evaluation
   */
  evaluatePosition(chess) {
    let score = 0;
    const board = chess.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = this.getPieceValue(piece.type);
          score += piece.color === 'w' ? value : -value;
        }
      }
    }

    return score;
  }

  /**
   * Get piece value for evaluation
   */
  getPieceValue(pieceType) {
    const values = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    return values[pieceType] || 0;
  }

  /**
   * Get hint for user
   */
  async getHint(gameId, userId) {
    try {
      const game = await this.getAIGameState(gameId);
      
      if (!game) {
        throw new Error('Game not found');
      }

      const userPlayer = game.players.find(p => p.user_id === userId);
      if (!userPlayer) {
        throw new Error('You are not in this game');
      }

      const chess = new Chess(game.current_fen);
      const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
      
      if (userPlayer.color !== currentTurn) {
        throw new Error('It is not your turn');
      }

      // Generate hint using AI logic
      const hintMove = this.getBestMoveAdvanced(chess);
      
      logger.info('Hint generated', { gameId, userId, hint: hintMove });
      
      return {
        hint: hintMove,
        message: 'Consider this move'
      };
    } catch (error) {
      logger.error('Failed to generate hint', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * End AI game
   */
  async endAIGame(gameId, userId) {
    try {
      const game = await db.Game.findByPk(gameId, {
        include: [{
          model: db.Player,
          as: 'players'
        }]
      });

      if (!game) {
        throw new Error('Game not found');
      }

      const userPlayer = game.players.find(p => p.user_id === userId);
      if (!userPlayer) {
        throw new Error('You are not in this game');
      }

      if (game.status === 'finished') {
        throw new Error('Game is already finished');
      }

      // End the game
      await db.Game.update({
        status: 'abandoned',
        finished_at: new Date()
      }, {
        where: { id: gameId }
      });

      logger.info('AI game ended', { gameId, userId });
      
      return { message: 'Game ended successfully' };
    } catch (error) {
      logger.error('Failed to end AI game', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Get difficulty description
   */
  getDifficultyDescription(difficulty) {
    const descriptions = {
      beginner: 'Perfect for learning the basics',
      easy: 'Good for casual play',
      intermediate: 'Balanced challenge',
      hard: 'Strong tactical play',
      expert: 'Advanced strategic thinking',
      master: 'Near-master level play'
    };
    return descriptions[difficulty] || 'Unknown difficulty';
  }
}

module.exports = new AIService();