// controllers/gameController.js
const gameService = require('../services/gameService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get list of games with filters
 */
async function getGames(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      game_type, 
      status, 
      is_rated,
      include_private = false 
    } = req.query;

    const filters = {
      ...(game_type && { game_type }),
      ...(status && { status }),
      ...(is_rated !== undefined && { is_rated: is_rated === 'true' }),
      include_private: include_private === 'true'
    };

    logger.info('Games list request', { 
      filters, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    const result = await gameService.getGames(filters, parseInt(page), parseInt(limit));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Games retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get games list', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'GAMES_FETCH_FAILED')
    );
  }
}

/**
 * Create a new game
 */
async function createGame(req, res) {
  try {
    const userId = req.user.id;
    const gameData = req.body;

    logger.info('Game creation request', { 
      userId, 
      gameData,
      ip: req.ip
    });

    const result = await gameService.createGame(userId, gameData);

    logger.info('Game created successfully', { 
      gameId: result.id, 
      userId,
      gameType: result.game_type
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, result, 'Game created successfully')
    );
  } catch (error) {
    logger.error('Failed to create game', { 
      error: error.message, 
      userId: req.user?.id,
      gameData: req.body
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatResponse(false, null, error.message, 'GAME_CREATION_FAILED')
    );
  }
}

/**
 * Get game details by ID
 */
async function getGameDetails(req, res) {
  try {
    const { gameId } = req.params;
    const requestingUserId = req.user?.id;

    logger.info('Game details request', { 
      gameId, 
      requestingUserId
    });

    const result = await gameService.getGameById(gameId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatResponse(false, null, 'Game not found', 'GAME_NOT_FOUND')
      );
    }

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Game details retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get game details', { 
      error: error.message, 
      gameId: req.params.gameId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'GAME_DETAILS_FAILED')
    );
  }
}

/**
 * Join an existing game
 */
async function joinGame(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { password } = req.body;

    logger.info('Game join request', { 
      gameId, 
      userId,
      hasPassword: !!password
    });

    const result = await gameService.joinGame(gameId, userId, password);

    logger.info('Player joined game successfully', { 
      gameId, 
      userId
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Joined game successfully')
    );
  } catch (error) {
    logger.error('Failed to join game', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('full') || error.message.includes('password') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'GAME_JOIN_FAILED')
    );
  }
}

/**
 * Make a move in a game
 */
async function makeMove(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { move, time_spent_ms, promotion } = req.body;

    logger.info('Move request', { 
      gameId, 
      userId, 
      move,
      timeSpent: time_spent_ms
    });

    const moveData = {
      move,
      time_spent_ms,
      ...(promotion && { promotion })
    };

    const result = await gameService.makeMove(gameId, userId, moveData);

    logger.info('Move made successfully', { 
      gameId, 
      userId, 
      move: result.move.san
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Move made successfully')
    );
  } catch (error) {
    logger.error('Failed to make move', { 
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
      formatResponse(false, null, error.message, 'MOVE_FAILED')
    );
  }
}

/**
 * Get move history for a game
 */
async function getMoveHistory(req, res) {
  try {
    const { gameId } = req.params;

    logger.info('Move history request', { 
      gameId,
      requestingUserId: req.user?.id
    });

    const result = await gameService.getMoveHistory(gameId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Move history retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get move history', { 
      error: error.message, 
      gameId: req.params.gameId 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'MOVE_HISTORY_FAILED')
    );
  }
}

/**
 * Resign from a game
 */
async function resignGame(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('Resignation request', { 
      gameId, 
      userId
    });

    const result = await gameService.resignGame(gameId, userId);

    logger.info('Player resigned successfully', { 
      gameId, 
      userId
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Resigned from game successfully')
    );
  } catch (error) {
    logger.error('Failed to resign from game', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not active') || error.message.includes('not a player') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'RESIGNATION_FAILED')
    );
  }
}

/**
 * Offer a draw
 */
async function offerDraw(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('Draw offer request', { 
      gameId, 
      userId
    });

    const result = await gameService.offerDraw(gameId, userId);

    logger.info('Draw offered successfully', { 
      gameId, 
      userId
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Draw offer sent successfully')
    );
  } catch (error) {
    logger.error('Failed to offer draw', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not active') || error.message.includes('not a player') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'DRAW_OFFER_FAILED')
    );
  }
}

/**
 * Respond to a draw offer
 */
async function respondToDraw(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'decline'

    logger.info('Draw response request', { 
      gameId, 
      userId,
      action
    });

    const result = await gameService.respondToDraw(gameId, userId, action);

    logger.info('Draw response processed successfully', { 
      gameId, 
      userId,
      action
    });

    const message = action === 'accept' ? 
      'Draw accepted - game ended' : 
      'Draw declined successfully';

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, message)
    );
  } catch (error) {
    logger.error('Failed to respond to draw', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id,
      action: req.body.action
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not active') || error.message.includes('not a player') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'DRAW_RESPONSE_FAILED')
    );
  }
}

/**
 * Get game opening information
 */
async function getGameOpening(req, res) {
  try {
    const { gameId } = req.params;

    logger.info('Game opening request', { 
      gameId,
      requestingUserId: req.user?.id
    });

    const result = await gameService.getGameOpening(gameId);

    const message = result ? 
      'Opening information retrieved successfully' : 
      'No opening detected for this game yet';

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, message)
    );
  } catch (error) {
    logger.error('Failed to get game opening', { 
      error: error.message, 
      gameId: req.params.gameId 
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'OPENING_FETCH_FAILED')
    );
  }
}

/**
 * Get game analysis (placeholder)
 */
async function getGameAnalysis(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    logger.info('Game analysis request', { 
      gameId, 
      userId
    });

    // TODO: Implement game analysis logic
    // This would typically involve:
    // 1. Check if user has access to analysis
    // 2. Retrieve existing analysis from database
    // 3. If no analysis exists, queue for engine analysis
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Game analysis not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get game analysis', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ANALYSIS_FAILED')
    );
  }
}

/**
 * Request engine analysis for a game
 */
async function requestAnalysis(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    const { depth = 15, engine = 'stockfish' } = req.body;

    logger.info('Analysis request', { 
      gameId, 
      userId,
      depth,
      engine
    });

    // TODO: Implement analysis request logic
    // This would typically involve:
    // 1. Validate user permissions
    // 2. Check if analysis already exists
    // 3. Queue analysis job
    // 4. Return job status
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Analysis request not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to request analysis', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ANALYSIS_REQUEST_FAILED')
    );
  }
}

/**
 * Get user's game history
 */
async function getUserGames(req, res) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, game_type, status } = req.query;
    const requestingUserId = req.user?.id;

    logger.info('User games request', { 
      userId, 
      requestingUserId,
      page,
      limit,
      game_type,
      status
    });

    // TODO: Implement getUserGames in gameService
    // For now, return not implemented
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'User games history not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get user games', { 
      error: error.message, 
      userId: req.params.userId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_GAMES_FAILED')
    );
  }
}

/**
 * Export game in PGN format (placeholder)
 */
async function exportGamePGN(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user?.id;

    logger.info('PGN export request', { 
      gameId, 
      userId
    });

    // TODO: Implement PGN export logic
    // This would typically involve:
    // 1. Get game details and moves
    // 2. Format as PGN
    // 3. Return as downloadable file
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'PGN export not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to export PGN', { 
      error: error.message, 
      gameId: req.params.gameId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PGN_EXPORT_FAILED')
    );
  }
}

/**
 * Add spectator to game (placeholder)
 */
async function spectateGame(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.user?.id;

    logger.info('Spectate request', { 
      gameId, 
      userId
    });

    // TODO: Implement spectating logic
    // This would typically involve:
    // 1. Check if game allows spectators
    // 2. Add user to spectator list
    // 3. Return game state for spectating
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Game spectating not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to spectate game', { 
      error: error.message, 
      gameId: req.params.gameId,
      userId: req.user?.id
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'SPECTATE_FAILED')
    );
  }
}

module.exports = {
  getGames,
  createGame,
  getGameDetails,
  joinGame,
  makeMove,
  getMoveHistory,
  resignGame,
  offerDraw,
  respondToDraw,
  getGameOpening,
  getGameAnalysis,
  requestAnalysis,
  getUserGames,
  exportGamePGN,
  spectateGame
};
