// controllers/aiController.js
const aiService = require('../services/aiService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get available AI difficulties
 */
async function getDifficulties(req, res) {
  try {
    logger.info('AI difficulties request', { 
      requestingUserId: req.user?.id,
      ip: req.ip
    });

    const result = aiService.getDifficulties();

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'AI difficulties retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get AI difficulties', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'AI_DIFFICULTIES_FAILED')
    );
  }
}

/**
 * Create a new AI game
 */
async function createAIGame(req, res) {
  try {
    const userId = req.user.id;
    const { difficulty, time_control, user_color } = req.body;

    logger.info('AI game creation request', { 
      userId, 
      difficulty,
      time_control,
      user_color,
      ip: req.ip
    });

    const gameData = {
      difficulty,
      time_control: time_control || '10+0',
      user_color: user_color || 'random'
    };

    const result = await aiService.createAIGame(userId, gameData);

    logger.info('AI game created successfully', { 
      gameId: result.id, 
      userId,
      difficulty,
      userColor: result.players.find(p => p.user_id === userId)?.color
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, result, 'AI game created successfully')
    );
  } catch (error) {
    logger.error('Failed to create AI game', { 
      error: error.message, 
      userId: req.user?.id,
      gameData: req.body
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('Invalid') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'AI_GAME_CREATION_FAILED')
    );
  }
}

/**
 * Get AI game state
 */
async function getAIGameState(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('AI game state request', { 
      gameId, 
      userId
    });

    const result = await aiService.getAIGameState(gameId);

    // Verify user is in this game
    const isPlayerInGame = result.players.some(player => player.user_id === userId);
    if (!isPlayerInGame) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatResponse(false, null, 'You are not a player in this game', 'ACCESS_DENIED')
      );
    }

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'AI game state retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get AI game state', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'AI_GAME_STATE_FAILED')
    );
  }
}

/**
 * Make a move in AI game
 */
async function makeAIMove(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { move, time_spent_ms } = req.body;

    logger.info('AI game move request', { 
      gameId, 
      userId, 
      move,
      timeSpent: time_spent_ms
    });

    const moveData = {
      move,
      time_spent_ms
    };

    const result = await aiService.makeUserMove(gameId, userId, moveData);

    logger.info('Move made in AI game successfully', { 
      gameId, 
      userId, 
      move: result.move.san
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Move made successfully')
    );
  } catch (error) {
    logger.error('Failed to make move in AI game', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id,
      move: req.body.move
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('Invalid') || error.message.includes('turn') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'AI_MOVE_FAILED')
    );
  }
}

/**
 * Get a hint for the current position
 */
async function getHint(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('AI hint request', { 
      gameId, 
      userId
    });

    const result = await aiService.getHint(gameId, userId);

    logger.info('AI hint generated successfully', { 
      gameId, 
      userId,
      hint: result.hint
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Hint generated successfully')
    );
  } catch (error) {
    logger.error('Failed to get AI hint', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not your turn') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'AI_HINT_FAILED')
    );
  }
}

/**
 * End/abandon an AI game
 */
async function endAIGame(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('AI game end request', { 
      gameId, 
      userId
    });

    const result = await aiService.endAIGame(gameId, userId);

    logger.info('AI game ended successfully', { 
      gameId, 
      userId
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'AI game ended successfully')
    );
  } catch (error) {
    logger.error('Failed to end AI game', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not in this game') ? 
      HTTP_STATUS.FORBIDDEN : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'AI_GAME_END_FAILED')
    );
  }
}

/**
 * Get AI game statistics for user (placeholder)
 */
async function getAIGameStats(req, res) {
  try {
    const userId = req.user.id;

    logger.info('AI game stats request', { userId });

    // TODO: Implement AI game statistics
    // This would include:
    // - Games played vs each difficulty
    // - Win/loss rates vs AI
    // - Average game duration
    // - Improvement over time
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'AI game statistics not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get AI game stats', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'AI_STATS_FAILED')
    );
  }
}

/**
 * Get position evaluation from AI (placeholder)
 */
async function getPositionEvaluation(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { depth = 10 } = req.body;

    logger.info('Position evaluation request', { 
      gameId, 
      userId,
      depth
    });

    // TODO: Implement position evaluation
    // This would involve:
    // 1. Get current position from game
    // 2. Run engine analysis
    // 3. Return evaluation score and best moves
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Position evaluation not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to evaluate position', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'POSITION_EVALUATION_FAILED')
    );
  }
}

/**
 * Configure AI difficulty mid-game (placeholder)
 */
async function adjustAIDifficulty(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { new_difficulty } = req.body;

    logger.info('AI difficulty adjustment request', { 
      gameId, 
      userId,
      new_difficulty
    });

    // TODO: Implement difficulty adjustment
    // This might be allowed in casual games
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'AI difficulty adjustment not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to adjust AI difficulty', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'AI_ADJUSTMENT_FAILED')
    );
  }
}

/**
 * Get AI training recommendations (placeholder)
 */
async function getTrainingRecommendations(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Training recommendations request', { userId });

    // TODO: Implement training recommendations
    // Based on user's performance vs AI:
    // - Suggest appropriate difficulty levels
    // - Identify weak areas
    // - Recommend specific training exercises
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Training recommendations not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get training recommendations', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'TRAINING_RECOMMENDATIONS_FAILED')
    );
  }
}

module.exports = {
  getDifficulties,
  createAIGame,
  getAIGameState,
  makeAIMove,
  getHint,
  endAIGame,
  getAIGameStats,
  getPositionEvaluation,
  adjustAIDifficulty,
  getTrainingRecommendations
};
