/**
 * AI Game Controller
 * Handles AI game-related HTTP requests
 */

const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const gameService = require('../services/gameService');

/**
 * Get available AI difficulty levels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDifficulties(req, res) {
  try {
    const difficulties = aiService.getDifficultyLevels();
    
    res.json(formatSuccessResponse(difficulties));
  } catch (error) {
    logger.error('Error getting AI difficulties', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to get difficulty levels')
    );
  }
}

/**
 * Create a new AI game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createAIGame(req, res) {
  try {
    const { difficulty = 'intermediate', playerColor = 'white', playerId } = req.body;
    
    logger.info('Creating new AI game', { 
      difficulty, 
      playerColor, 
      playerId,
      ip: req.ip 
    });
    
    const gameData = await aiService.createGame(difficulty, playerColor, playerId);
    
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccessResponse(gameData, SUCCESS_MESSAGES.GAME_CREATED)
    );
  } catch (error) {
    logger.error('Error creating AI game', { 
      error: error.message, 
      body: req.body 
    });
    
    if (error.message === ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(
        formatErrorResponse(error.message)
      );
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to create AI game')
    );
  }
}

/**
 * Get AI game state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAIGameState(req, res) {
  try {
    const { gameId } = req.params;
    
    logger.debug('Fetching AI game state', { gameId });
    
    const gameData = await aiService.getGameState(gameId);
    
    if (!gameData) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatErrorResponse(ERROR_MESSAGES.GAME_NOT_FOUND)
      );
    }
    
    res.json(formatSuccessResponse(gameData));
  } catch (error) {
    logger.error('Error getting AI game state', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to get game state')
    );
  }
}

/**
 * Make a move in AI game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function makeAIMove(req, res) {
  try {
    const { gameId } = req.params;
    const { move } = req.body;
    
    logger.info('Making AI move', { gameId, move });
    
    const result = await aiService.makeMove(gameId, move);
    
    if (result.error) {
      const statusCode = result.error === ERROR_MESSAGES.GAME_NOT_FOUND ? 
        HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      
      return res.status(statusCode).json(
        formatErrorResponse(result.error)
      );
    }
    
    res.json(formatSuccessResponse(result, SUCCESS_MESSAGES.MOVE_MADE));
  } catch (error) {
    logger.error('Error making AI move', { 
      error: error.message, 
      gameId: req.params.gameId, 
      move: req.body.move 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to make move')
    );
  }
}

/**
 * Evaluate current position
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function evaluatePosition(req, res) {
  try {
    const { gameId } = req.params;
    
    logger.info('Evaluating position', { gameId });
    
    const evaluation = await aiService.evaluatePosition(gameId);
    
    if (evaluation.error) {
      const statusCode = evaluation.error === ERROR_MESSAGES.GAME_NOT_FOUND ? 
        HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      
      return res.status(statusCode).json(
        formatErrorResponse(evaluation.error)
      );
    }
    
    res.json(formatSuccessResponse(evaluation));
  } catch (error) {
    logger.error('Error evaluating position', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to evaluate position')
    );
  }
}

/**
 * End AI game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function endAIGame(req, res) {
  try {
    const { gameId } = req.params;
    
    logger.info('Ending AI game', { gameId });
    
    const result = await aiService.endGame(gameId);
    
    if (result.error) {
      const statusCode = result.error === ERROR_MESSAGES.GAME_NOT_FOUND ? 
        HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      
      return res.status(statusCode).json(
        formatErrorResponse(result.error)
      );
    }
    
    res.json(formatSuccessResponse(null, SUCCESS_MESSAGES.GAME_ENDED));
  } catch (error) {
    logger.error('Error ending AI game', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to end game')
    );
  }
}

module.exports = {
  getDifficulties,
  createAIGame,
  getAIGameState,
  makeAIMove,
  evaluatePosition,
  endAIGame
};
