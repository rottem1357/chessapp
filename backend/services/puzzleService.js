// services/puzzleService.js
const { Chess } = require('chess.js');
const db = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class PuzzleService {
  /**
   * Get a random puzzle based on criteria
   */
  async getRandomPuzzle(filters = {}, userId = null) {
    try {
      const whereClause = {};

      // Filter by rating range
      if (filters.rating) {
        const ratingRange = 200; // ±200 points
        whereClause.rating = {
          [Op.between]: [filters.rating - ratingRange, filters.rating + ratingRange]
        };
      }

      // Filter by themes
      if (filters.themes) {
        const themeArray = filters.themes.split(',').map(t => t.trim());
        whereClause.themes = {
          [Op.contains]: themeArray
        };
      }

      // Get total count for random selection
      const totalPuzzles = await db.Puzzle.count({ where: whereClause });
      
      if (totalPuzzles === 0) {
        throw new Error('No puzzles found matching criteria');
      }

      // Get random offset
      const randomOffset = Math.floor(Math.random() * totalPuzzles);

      const puzzle = await db.Puzzle.findOne({
        where: whereClause,
        offset: randomOffset,
        attributes: ['id', 'fen', 'rating', 'themes', 'popularity']
      });

      if (!puzzle) {
        throw new Error('Puzzle not found');
      }

      // Don't include the solution moves in the response
      logger.info('Random puzzle retrieved', { 
        puzzleId: puzzle.id, 
        userId, 
        rating: puzzle.rating 
      });

      return puzzle;
    } catch (error) {
      logger.error('Failed to get random puzzle', { error: error.message, filters, userId });
      throw error;
    }
  }

  /**
   * Get puzzle by ID
   */
  async getPuzzleById(puzzleId, userId = null) {
    try {
      const puzzle = await db.Puzzle.findByPk(puzzleId, {
        attributes: ['id', 'fen', 'rating', 'themes', 'popularity', 'success_rate']
      });

      if (!puzzle) {
        throw new Error('Puzzle not found');
      }

      // Check if user has already attempted this puzzle
      let userAttempt = null;
      if (userId) {
        userAttempt = await db.PuzzleAttempt.findOne({
          where: {
            puzzle_id: puzzleId,
            user_id: userId
          },
          order: [['created_at', 'DESC']]
        });
      }

      logger.info('Puzzle retrieved by ID', { puzzleId, userId });

      return {
        ...puzzle.toJSON(),
        userAttempt: userAttempt ? {
          is_solved: userAttempt.is_solved,
          time_spent_ms: userAttempt.time_spent_ms,
          created_at: userAttempt.created_at
        } : null
      };
    } catch (error) {
      logger.error('Failed to get puzzle by ID', { error: error.message, puzzleId, userId });
      throw error;
    }
  }

  /**
   * Submit a puzzle attempt
   */
  async submitAttempt(puzzleId, userId, attemptData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const puzzle = await db.Puzzle.findByPk(puzzleId, { transaction });
      if (!puzzle) {
        throw new Error('Puzzle not found');
      }

      const user = await db.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate the solution
      const isCorrect = this.validateSolution(puzzle, attemptData.moves);
      
      // Create attempt record
      const attempt = await db.PuzzleAttempt.create({
        puzzle_id: puzzleId,
        user_id: userId,
        is_solved: isCorrect,
        moves_played: attemptData.moves,
        time_spent_ms: attemptData.time_spent_ms,
        rating_before: user.rating_puzzle
      }, { transaction });

      // Update user statistics
      const userUpdates = {
        puzzles_attempted: user.puzzles_attempted + 1,
        updated_at: new Date()
      };

      if (isCorrect) {
        userUpdates.puzzles_solved = user.puzzles_solved + 1;
      }

      await db.User.update(userUpdates, {
        where: { id: userId },
        transaction
      });

      // Update puzzle statistics
      await db.Puzzle.update({
        popularity: db.Sequelize.literal('popularity + 1')
      }, {
        where: { id: puzzleId },
        transaction
      });

      // Calculate rating change if puzzle was solved
      let ratingChange = 0;
      let newRating = user.rating_puzzle;

      if (isCorrect) {
        ratingChange = this.calculatePuzzleRatingChange(
          user.rating_puzzle,
          puzzle.rating,
          attemptData.time_spent_ms
        );
        newRating = Math.max(400, user.rating_puzzle + ratingChange);

        await db.User.update({
          rating_puzzle: newRating
        }, {
          where: { id: userId },
          transaction
        });

        // Update attempt with rating changes
        await db.PuzzleAttempt.update({
          rating_after: newRating,
          rating_change: ratingChange
        }, {
          where: { id: attempt.id },
          transaction
        });

        // Record rating history
        await db.Rating.create({
          user_id: userId,
          rating_type: 'puzzle',
          rating_before: user.rating_puzzle,
          rating_after: newRating,
          rating_change: ratingChange,
          k_factor: 32
        }, { transaction });
      }

      // Update puzzle success rate
      await this.updatePuzzleSuccessRate(puzzleId, transaction);

      await transaction.commit();

      logger.info('Puzzle attempt submitted', { 
        puzzleId, 
        userId, 
        isCorrect, 
        ratingChange,
        timeSpent: attemptData.time_spent_ms 
      });

      return {
        is_solved: isCorrect,
        correct_solution: puzzle.moves,
        rating_change: ratingChange,
        new_rating: newRating,
        time_spent_ms: attemptData.time_spent_ms,
        explanation: this.getExplanation(puzzle, isCorrect)
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to submit puzzle attempt', { error: error.message, puzzleId, userId });
      throw error;
    }
  }

  /**
   * Validate puzzle solution
   */
  validateSolution(puzzle, playerMoves) {
    try {
      const chess = new Chess(puzzle.fen);
      const correctMoves = JSON.parse(puzzle.moves);
      
      // Check if player moves match the beginning of the correct solution
      if (playerMoves.length > correctMoves.length) {
        return false;
      }

      for (let i = 0; i < playerMoves.length; i++) {
        const move = chess.move(playerMoves[i]);
        if (!move || move.san !== correctMoves[i]) {
          return false;
        }
      }

      // For a complete solution, all moves must be played
      return playerMoves.length === correctMoves.length;
    } catch (error) {
      logger.error('Error validating puzzle solution', { error: error.message });
      return false;
    }
  }

  /**
   * Calculate rating change for puzzle
   */
  calculatePuzzleRatingChange(playerRating, puzzleRating, timeSpentMs) {
    const baseDifference = puzzleRating - playerRating;
    let ratingChange = Math.round(baseDifference / 20) + 10;

    // Bonus for fast solving
    const timeBonus = Math.max(0, 10 - Math.floor(timeSpentMs / 5000));
    ratingChange += timeBonus;

    // Cap the rating change
    return Math.max(-50, Math.min(50, ratingChange));
  }

  /**
   * Update puzzle success rate
   */
  async updatePuzzleSuccessRate(puzzleId, transaction) {
    try {
      const attempts = await db.PuzzleAttempt.count({
        where: { puzzle_id: puzzleId },
        transaction
      });

      const successes = await db.PuzzleAttempt.count({
        where: { 
          puzzle_id: puzzleId,
          is_solved: true 
        },
        transaction
      });

      const successRate = attempts > 0 ? (successes / attempts) * 100 : 0;

      await db.Puzzle.update({
        success_rate: successRate.toFixed(2)
      }, {
        where: { id: puzzleId },
        transaction
      });
    } catch (error) {
      logger.error('Failed to update puzzle success rate', { error: error.message, puzzleId });
    }
  }

  /**
   * Get puzzle categories/themes
   */
  async getCategories() {
    try {
      // Get all unique themes from puzzles
      const puzzles = await db.Puzzle.findAll({
        attributes: ['themes'],
        where: {
          themes: { [Op.not]: null }
        }
      });

      const themeSet = new Set();
      puzzles.forEach(puzzle => {
        if (puzzle.themes) {
          puzzle.themes.forEach(theme => themeSet.add(theme));
        }
      });

      const categories = Array.from(themeSet).map(theme => ({
        name: theme,
        display_name: this.formatThemeName(theme),
        description: this.getThemeDescription(theme)
      }));

      return categories.sort((a, b) => a.display_name.localeCompare(b.display_name));
    } catch (error) {
      logger.error('Failed to get puzzle categories', { error: error.message });
      throw error;
    }
  }

  /**
   * Format theme name for display
   */
  formatThemeName(theme) {
    return theme.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Get theme description
   */
  getThemeDescription(theme) {
    const descriptions = {
      fork: 'Attack two pieces at once',
      pin: 'Prevent a piece from moving',
      skewer: 'Force a valuable piece to move',
      discovery: 'Reveal an attack by moving another piece',
      deflection: 'Draw a defending piece away',
      decoy: 'Lure a piece to a bad square',
      sacrifice: 'Give up material for advantage',
      mate_in_1: 'Checkmate in one move',
      mate_in_2: 'Checkmate in two moves',
      mate_in_3: 'Checkmate in three moves',
      endgame: 'Late game positions',
      opening: 'Early game tactics',
      middlegame: 'Mid-game combinations',
      tactics: 'Tactical combinations',
      strategy: 'Strategic concepts'
    };

    return descriptions[theme] || 'Chess tactical theme';
  }

  /**
   * Get explanation for puzzle result
   */
  getExplanation(puzzle, isCorrect) {
    if (isCorrect) {
      return 'Excellent! You found the correct solution.';
    } else {
      return 'Not quite right. Keep practicing tactical patterns!';
    }
  }

  /**
   * Get user's recent puzzle attempts
   */
  async getUserRecentAttempts(userId, limit = 10) {
    try {
      const attempts = await db.PuzzleAttempt.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        include: [{
          model: db.Puzzle,
          as: 'puzzle',
          attributes: ['id', 'rating', 'themes']
        }]
      });

      return attempts;
    } catch (error) {
      logger.error('Failed to get user recent attempts', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get puzzles by difficulty range
   */
  async getPuzzlesByDifficulty(minRating, maxRating, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await db.Puzzle.findAndCountAll({
        where: {
          rating: {
            [Op.between]: [minRating, maxRating]
          }
        },
        order: [['popularity', 'DESC']],
        limit,
        offset,
        attributes: ['id', 'fen', 'rating', 'themes', 'popularity', 'success_rate']
      });

      return {
        puzzles: rows,
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
      logger.error('Failed to get puzzles by difficulty', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PuzzleService();