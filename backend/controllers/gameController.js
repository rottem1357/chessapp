/**
 * Game Controller
 * Handles multiplayer game-related HTTP requests
 */

const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const gameService = require('../services/gameService');

/**
 * Get server health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getHealth(req, res) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(formatSuccessResponse(health));
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Health check failed')
    );
  }
}

/**
 * Get list of active games
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGames(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const games = gameService.getActiveGames(page, limit);
    
    res.json(formatSuccessResponse(games));
  } catch (error) {
    logger.error('Error getting games list', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to get games list')
    );
  }
}

/**
 * Get game details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGameDetails(req, res) {
  try {
    const { gameId } = req.params;
    
    const game = gameService.getGame(gameId);
    
    if (!game) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatErrorResponse(ERROR_MESSAGES.GAME_NOT_FOUND)
      );
    }
    
    res.json(formatSuccessResponse(game));
  } catch (error) {
    logger.error('Error getting game details', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to get game details')
    );
  }
}

/**
 * Create a new multiplayer game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createGame(req, res) {
  try {
    const { playerData } = req.body;
    
    logger.info('Creating new multiplayer game', { 
      playerData,
      ip: req.ip 
    });
    
    const game = gameService.createGame(playerData);
    
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccessResponse(game, SUCCESS_MESSAGES.GAME_CREATED)
    );
  } catch (error) {
    logger.error('Error creating game', { 
      error: error.message, 
      body: req.body 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to create game')
    );
  }
}

/**
 * Join an existing game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function joinGame(req, res) {
  try {
    const { gameId } = req.params;
    const { playerData } = req.body;
    
    logger.info('Player joining game', { 
      gameId, 
      playerData,
      ip: req.ip 
    });
    
    const result = gameService.joinGame(gameId, playerData);
    
    if (result.error) {
      const statusCode = result.error === ERROR_MESSAGES.GAME_NOT_FOUND ? 
        HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      
      return res.status(statusCode).json(
        formatErrorResponse(result.error)
      );
    }
    
    res.json(formatSuccessResponse(result, SUCCESS_MESSAGES.PLAYER_JOINED));
  } catch (error) {
    logger.error('Error joining game', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to join game')
    );
  }
}

/**
 * Leave/end a game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function leaveGame(req, res) {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    
    logger.info('Player leaving game', { gameId, playerId });
    
    const result = gameService.leaveGame(gameId, playerId);
    
    if (result.error) {
      const statusCode = result.error === ERROR_MESSAGES.GAME_NOT_FOUND ? 
        HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      
      return res.status(statusCode).json(
        formatErrorResponse(result.error)
      );
    }
    
    res.json(formatSuccessResponse(null, SUCCESS_MESSAGES.GAME_ENDED));
  } catch (error) {
    logger.error('Error leaving game', { 
      error: error.message, 
      gameId: req.params.gameId 
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to leave game')
    );
  }
}

/**
 * Get game statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGameStats(req, res) {
  try {
    const stats = gameService.getGameStats();
    
    res.json(formatSuccessResponse(stats));
  } catch (error) {
    logger.error('Error getting game statistics', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('Failed to get game statistics')
    );
  }
}

module.exports = {
  getHealth,
  getGames,
  getGameDetails,
  createGame,
  joinGame,
  leaveGame,
  getGameStats
};
