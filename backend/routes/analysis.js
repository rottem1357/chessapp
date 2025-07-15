/**
 * Game Routes
 * Routes for multiplayer games
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateGameId, 
  validatePlayerData, 
  validatePagination 
} = require('../middleware/validation');
const {
  getHealth,
  getGames,
  getGameDetails,
  createGame,
  joinGame,
  leaveGame,
  getGameStats
} = require('../controllers/gameController');

const router = express.Router();

// Health check
router.get('/health', asyncHandler(getHealth));

// Game statistics
router.get('/stats', asyncHandler(getGameStats));

// Get games list
router.get('/games', 
  validatePagination,
  asyncHandler(getGames)
);

// Create new game
router.post('/games', 
  validatePlayerData,
  asyncHandler(createGame)
);

// Get game details
router.get('/games/:gameId', 
  validateGameId,
  asyncHandler(getGameDetails)
);

// Join game
router.post('/games/:gameId/join',
  validateGameId,
  validatePlayerData,
  asyncHandler(joinGame)
);

// Leave game
router.post('/games/:gameId/leave',
  validateGameId,
  asyncHandler(leaveGame)
);

module.exports = router;
