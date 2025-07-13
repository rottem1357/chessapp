/**
 * AI Game Routes
 * Routes for AI opponent games
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateGameId, 
  validateMoveData, 
  validateAIGameData 
} = require('../middleware/validation');
const {
  getDifficulties,
  createAIGame,
  getAIGameState,
  makeAIMove,
  evaluatePosition,
  endAIGame
} = require('../controllers/aiController');

const router = express.Router();

// Get available difficulty levels
router.get('/difficulties', asyncHandler(getDifficulties));

// Create new AI game
router.post('/game/new', 
  validateAIGameData,
  asyncHandler(createAIGame)
);

// Get AI game state
router.get('/game/:gameId', 
  validateGameId,
  asyncHandler(getAIGameState)
);

// Make move in AI game
router.post('/game/:gameId/move',
  validateGameId,
  validateMoveData,
  asyncHandler(makeAIMove)
);

// Evaluate current position
router.post('/game/:gameId/evaluate',
  validateGameId,
  asyncHandler(evaluatePosition)
);

// End AI game
router.delete('/game/:gameId',
  validateGameId,
  asyncHandler(endAIGame)
);

module.exports = router;
