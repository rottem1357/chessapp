// services/gameService.js
const { Chess } = require('chess.js');
const logger = require('../utils/logger');

class GameService {
  // Get database instance with lazy loading
  get db() {
    return require('../models');
  }

  /**
   * Create a new game
   */
  async createGame(userId, gameData) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const user = await this.db.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Parse time control
      const [minutes, increment] = (gameData.time_control || '10+0').split('+').map(Number);
      const timeLimit = gameData.time_limit_seconds || (minutes * 60);
      const incrementSeconds = gameData.increment_seconds || increment;

      // Create game
      const game = await this.db.Game.create({
        game_type: gameData.game_type || 'rapid',
        time_control: gameData.time_control || '10+0',
        time_limit_seconds: timeLimit,
        increment_seconds: incrementSeconds,
        is_rated: gameData.is_rated !== false,
        is_private: gameData.is_private || false,
        password: gameData.password || null,
        white_time_remaining: timeLimit * 1000,
        black_time_remaining: timeLimit * 1000
      }, { transaction });

      // Determine color
      let color = gameData.preferred_color || 'random';
      if (color === 'random') {
        color = Math.random() > 0.5 ? 'white' : 'black';
      }

      // Get user's rating for this game type
      const ratingField = `rating_${gameData.game_type || 'rapid'}`;
      const currentRating = user[ratingField] || user.rating_rapid;

      // Create player
      await this.db.Player.create({
        game_id: game.id,
        user_id: userId,
        color: color,
        rating_before: currentRating
      }, { transaction });

      await transaction.commit();
      
      logger.info('Game created', { gameId: game.id, userId, gameType: game.game_type });
      
      return await this.getGameById(game.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create game', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId, userId, password = null) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Player,
          as: 'players',
          include: [{ 
            model: this.db.User, 
            as: 'user',
            attributes: ['id', 'username', 'display_name']
          }]
        }],
        transaction
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'waiting') {
        throw new Error('Game is not available for joining');
      }

      if (game.players.length >= 2) {
        throw new Error('Game is full');
      }

      if (game.is_private && game.password !== password) {
        throw new Error('Incorrect password for private game');
      }

      // Check if user is already in the game
      const existingPlayer = game.players.find(p => p.user_id === userId);
      if (existingPlayer) {
        throw new Error('You are already in this game');
      }

      const user = await this.db.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Determine color (opposite of existing player)
      const existingColor = game.players[0].color;
      const newColor = existingColor === 'white' ? 'black' : 'white';
      
      const ratingField = `rating_${game.game_type}`;
      const currentRating = user[ratingField] || user.rating_rapid;

      // Create player
      await this.db.Player.create({
        game_id: gameId,
        user_id: userId,
        color: newColor,
        rating_before: currentRating
      }, { transaction });

      // Start the game
      await this.db.Game.update({
        status: 'active',
        started_at: new Date()
      }, {
        where: { id: gameId },
        transaction
      });

      await transaction.commit();
      
      logger.info('Player joined game', { gameId, userId, color: newColor });
      
      return await this.getGameById(gameId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to join game', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Make a move in a game
   */
  async makeMove(gameId, userId, moveData) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Player,
          as: 'players',
          include: [{ 
            model: this.db.User, 
            as: 'user',
            attributes: ['id', 'username', 'display_name']
          }]
        }],
        transaction
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'active') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.user_id === userId);
      if (!player) {
        throw new Error('You are not a player in this game');
      }

      // Validate turn
      const chess = new Chess(game.current_fen);
      const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
      
      if (player.color !== currentTurn) {
        throw new Error('It is not your turn');
      }

      // Make the move
      let move;
      try {
        move = chess.move(moveData.move);
        if (!move) {
          throw new Error('Invalid move');
        }
      } catch (err) {
        throw new Error('Invalid move: ' + err.message);
      }

      // Calculate move number
      const moveNumber = Math.ceil((game.move_count + 1) / 2);

      // Record move in database
      const dbMove = await this.db.Move.create({
        game_id: gameId,
        player_id: player.id,
        move_number: moveNumber,
        color: player.color,
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
        time_spent_ms: moveData.time_spent_ms || null
      }, { transaction });

      // Update game state
      const updateData = {
        current_fen: chess.fen(),
        current_turn: chess.turn() === 'w' ? 'white' : 'black',
        move_count: game.move_count + 1,
        last_move_at: new Date()
      };

      // Handle time updates if provided
      if (moveData.time_spent_ms !== undefined) {
        const timeRemaining = player.color === 'white' ? 
          game.white_time_remaining : game.black_time_remaining;
        
        const newTimeRemaining = Math.max(0, 
          timeRemaining - moveData.time_spent_ms + (game.increment_seconds * 1000)
        );

        if (player.color === 'white') {
          updateData.white_time_remaining = newTimeRemaining;
        } else {
          updateData.black_time_remaining = newTimeRemaining;
        }

        // Update move with remaining time
        await this.db.Move.update(
          { time_remaining_ms: newTimeRemaining },
          { where: { id: dbMove.id }, transaction }
        );
      }

      // Check for game end
      if (chess.isGameOver()) {
        updateData.status = 'finished';
        updateData.finished_at = new Date();
        
        if (chess.isCheckmate()) {
          updateData.result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
          updateData.result_reason = 'checkmate';
          
          // Mark winner
          const winnerId = chess.turn() === 'w' ? 
            game.players.find(p => p.color === 'black').id :
            game.players.find(p => p.color === 'white').id;
          
          await this.db.Player.update({ is_winner: true }, {
            where: { id: winnerId },
            transaction
          });
          await this.db.Player.update({ is_winner: false }, {
            where: { id: { [this.db.Sequelize.Op.ne]: winnerId }, game_id: gameId },
            transaction
          });
          
        } else if (chess.isStalemate()) {
          updateData.result = 'draw';
          updateData.result_reason = 'stalemate';
        } else if (chess.isDraw()) {
          updateData.result = 'draw';
          if (chess.isInsufficientMaterial()) {
            updateData.result_reason = 'insufficient_material';
          } else if (chess.isThreefoldRepetition()) {
            updateData.result_reason = 'threefold_repetition';
          } else {
            updateData.result_reason = 'fifty_move_rule';
          }
        }

        // Update player statistics and ratings if game is rated
        if (game.is_rated && updateData.result) {
          await this.updatePlayerStatsAndRatings(game, updateData.result, transaction);
        }
      }

      await this.db.Game.update(updateData, {
        where: { id: gameId },
        transaction
      });

      await transaction.commit();
      
      logger.info('Move made', { 
        gameId, 
        userId, 
        move: move.san,
        gameStatus: updateData.status || 'active'
      });

      return {
        move: {
          id: dbMove.id,
          san: move.san,
          uci: dbMove.uci,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          promotion: move.promotion,
          check: chess.isCheck(),
          checkmate: chess.isCheckmate(),
          fen: chess.fen()
        },
        game: await this.getGameById(gameId)
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to make move', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Resign from a game
   */
  async resignGame(gameId, userId) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Player,
          as: 'players',
          include: [{ 
            model: this.db.User, 
            as: 'user',
            attributes: ['id', 'username', 'display_name']
          }]
        }],
        transaction
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'active') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.user_id === userId);
      if (!player) {
        throw new Error('You are not a player in this game');
      }

      // Determine winner (opponent)
      const opponent = game.players.find(p => p.user_id !== userId);
      const result = player.color === 'white' ? 'black_wins' : 'white_wins';

      // Update game
      await this.db.Game.update({
        status: 'finished',
        result: result,
        result_reason: 'resignation',
        finished_at: new Date()
      }, {
        where: { id: gameId },
        transaction
      });

      // Update player records
      await this.db.Player.update({ is_winner: true }, {
        where: { id: opponent.id },
        transaction
      });
      await this.db.Player.update({ is_winner: false }, {
        where: { id: player.id },
        transaction
      });

      // Update player statistics and ratings if game is rated
      if (game.is_rated) {
        await this.updatePlayerStatsAndRatings(game, result, transaction);
      }

      await transaction.commit();
      
      logger.info('Player resigned from game', { gameId, userId });
      
      return await this.getGameById(gameId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to resign game', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Offer a draw
   */
  async offerDraw(gameId, userId) {
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Player,
          as: 'players'
        }]
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'active') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.user_id === userId);
      if (!player) {
        throw new Error('You are not a player in this game');
      }

      // TODO: Implement draw offer logic (store in database or memory)
      logger.info('Draw offered', { gameId, userId });
      
      return { message: 'Draw offer sent' };
    } catch (error) {
      logger.error('Failed to offer draw', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Respond to a draw offer
   */
  async respondToDraw(gameId, userId, action) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Player,
          as: 'players'
        }],
        transaction
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'active') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.user_id === userId);
      if (!player) {
        throw new Error('You are not a player in this game');
      }

      if (action === 'accept') {
        // Accept draw
        await this.db.Game.update({
          status: 'finished',
          result: 'draw',
          result_reason: 'mutual_agreement',
          finished_at: new Date()
        }, {
          where: { id: gameId },
          transaction
        });

        // Mark both players as having no winner (draw)
        await this.db.Player.update({ is_winner: null }, {
          where: { game_id: gameId },
          transaction
        });

        // Update player statistics if game is rated
        if (game.is_rated) {
          await this.updatePlayerStatsAndRatings(game, 'draw', transaction);
        }

        await transaction.commit();
        
        logger.info('Draw accepted', { gameId, userId });
        return await this.getGameById(gameId);
      } else {
        // Decline draw
        await transaction.commit();
        
        logger.info('Draw declined', { gameId, userId });
        return { message: 'Draw offer declined' };
      }
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to respond to draw', { error: error.message, gameId, userId });
      throw error;
    }
  }

  /**
   * Get game by ID with full details
   */
  async getGameById(gameId) {
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [
          {
            model: this.db.Player,
            as: 'players',
            include: [{
              model: this.db.User,
              as: 'user',
              attributes: ['id', 'username', 'display_name', 'rating_rapid', 'rating_blitz', 'rating_bullet']
            }]
          },
          {
            model: this.db.Move,
            as: 'moves',
            order: [['created_at', 'ASC']],
            limit: 200 // Limit moves for performance
          },
          {
            model: this.db.Opening,
            as: 'opening',
            attributes: ['id', 'eco_code', 'name', 'variation']
          }
        ]
      });

      if (!game) {
        return null;
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
          legalMoves: chess.moves(),
          inCheck: chess.inCheck()
        }
      };
    } catch (error) {
      logger.error('Failed to get game by ID', { error: error.message, gameId });
      throw error;
    }
  }

  /**
   * Get active games with filters
   */
  async getGames(filters = {}, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (filters.status) {
        whereClause.status = filters.status;
      } else {
        whereClause.status = ['waiting', 'active']; // Default to active games
      }

      if (filters.game_type) {
        whereClause.game_type = filters.game_type;
      }

      if (filters.is_rated !== undefined) {
        whereClause.is_rated = filters.is_rated;
      }

      if (!filters.include_private) {
        whereClause.is_private = false;
      }

      const { count, rows } = await this.db.Game.findAndCountAll({
        where: whereClause,
        include: [{
          model: this.db.Player,
          as: 'players',
          include: [{
            model: this.db.User,
            as: 'user',
            attributes: ['id', 'username', 'display_name', 'rating_rapid', 'rating_blitz', 'rating_bullet']
          }]
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        attributes: [
          'id', 'game_type', 'time_control', 'status', 'is_rated', 'is_private',
          'created_at', 'started_at', 'move_count'
        ]
      });

      return {
        games: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: offset + limit < count,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get games', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Get move history for a game
   */
  async getMoveHistory(gameId) {
    try {
      // First check if the game exists
      const game = await this.db.Game.findByPk(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const moves = await this.db.Move.findAll({
        where: { game_id: gameId },
        order: [['created_at', 'ASC']],
        include: [{
          model: this.db.Player,
          as: 'player',
          include: [{
            model: this.db.User,
            as: 'user',
            attributes: ['id', 'username', 'display_name']
          }]
        }]
      });

      return moves;
    } catch (error) {
      logger.error('Failed to get move history', { error: error.message, gameId });
      throw error;
    }
  }

  /**
   * Get game's detected opening
   */
  async getGameOpening(gameId) {
    try {
      const game = await this.db.Game.findByPk(gameId, {
        include: [{
          model: this.db.Opening,
          as: 'opening'
        }]
      });

      if (!game) {
        throw new Error('Game not found');
      }

      // If no opening detected yet, try to detect it
      if (!game.opening && game.move_count >= 6) {
        const opening = await this.detectGameOpening(gameId);
        if (opening) {
          return opening;
        }
      }

      return game.opening;
    } catch (error) {
      logger.error('Failed to get game opening', { error: error.message, gameId });
      throw error;
    }
  }

  /**
   * Detect game opening from moves
   */
  async detectGameOpening(gameId) {
    try {
      const moves = await this.db.Move.findAll({
        where: { game_id: gameId },
        order: [['move_number', 'ASC'], ['color', 'ASC']],
        limit: 20 // First 10 moves for each side
      });

      if (moves.length < 6) {
        return null;
      }

      // Build move string
      const moveString = moves.map(move => move.san).join(' ');

      // Find matching opening
      const opening = await this.db.Opening.findOne({
        where: {
          moves: {
            [this.db.Sequelize.Op.like]: `${moveString.substring(0, 20)}%`
          }
        },
        order: [['move_count', 'DESC']] // Get most specific match
      });

      if (opening) {
        // Update game with detected opening
        await this.db.Game.update({
          opening_id: opening.id
        }, {
          where: { id: gameId }
        });

        // Update opening popularity
        await this.db.Opening.update({
          popularity: this.db.Sequelize.literal('popularity + 1')
        }, {
          where: { id: opening.id }
        });

        logger.info('Opening detected for game', { gameId, openingId: opening.id });
      }

      return opening;
    } catch (error) {
      logger.error('Failed to detect opening', { error: error.message, gameId });
      return null;
    }
  }

  /**
   * Update player statistics and ratings after game ends
   */
  async updatePlayerStatsAndRatings(game, result, transaction) {
    try {
      for (const player of game.players) {
        const user = await this.db.User.findByPk(player.user_id, { transaction });
        if (!user) continue;

        // Determine result for this player
        let playerResult;
        if (result === 'draw') {
          playerResult = 'draw';
        } else if (
          (result === 'white_wins' && player.color === 'white') ||
          (result === 'black_wins' && player.color === 'black')
        ) {
          playerResult = 'win';
        } else {
          playerResult = 'loss';
        }

        // Update game statistics
        const statUpdates = {
          games_played: user.games_played + 1
        };

        if (playerResult === 'win') {
          statUpdates.games_won = user.games_won + 1;
        } else if (playerResult === 'loss') {
          statUpdates.games_lost = user.games_lost + 1;
        } else {
          statUpdates.games_drawn = user.games_drawn + 1;
        }

        await this.db.User.update(statUpdates, {
          where: { id: player.user_id },
          transaction
        });

        // Calculate rating change (simplified ELO system)
        const opponent = game.players.find(p => p.id !== player.id);
        if (opponent) {
          const ratingChange = this.calculateRatingChange(
            player.rating_before,
            opponent.rating_before,
            playerResult
          );

          const newRating = Math.max(400, player.rating_before + ratingChange);
          const ratingField = `rating_${game.game_type}`;

          // Update user rating
          await this.db.User.update({
            [ratingField]: newRating
          }, {
            where: { id: player.user_id },
            transaction
          });

          // Update player record
          await this.db.Player.update({
            rating_after: newRating,
            rating_change: ratingChange
          }, {
            where: { id: player.id },
            transaction
          });

          // Record rating history
          await this.db.Rating.create({
            user_id: player.user_id,
            game_id: game.id,
            rating_type: game.game_type,
            rating_before: player.rating_before,
            rating_after: newRating,
            rating_change: ratingChange,
            opponent_rating: opponent.rating_before,
            expected_score: this.calculateExpectedScore(player.rating_before, opponent.rating_before),
            actual_score: playerResult === 'win' ? 1.0 : (playerResult === 'draw' ? 0.5 : 0.0),
            k_factor: this.getKFactor(user.games_played)
          }, { transaction });
        }
      }
    } catch (error) {
      logger.error('Failed to update player stats and ratings', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate rating change using ELO system
   */
  calculateRatingChange(playerRating, opponentRating, result) {
    const kFactor = 32; // Can be adjusted based on player experience
    const expectedScore = this.calculateExpectedScore(playerRating, opponentRating);
    
    let actualScore;
    if (result === 'win') actualScore = 1.0;
    else if (result === 'draw') actualScore = 0.5;
    else actualScore = 0.0;

    return Math.round(kFactor * (actualScore - expectedScore));
  }

  /**
   * Calculate expected score in ELO system
   */
  calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Get K-factor based on player experience
   */
  getKFactor(gamesPlayed) {
    if (gamesPlayed < 30) return 40;
    if (gamesPlayed < 100) return 32;
    return 24;
  }
}

module.exports = new GameService();
