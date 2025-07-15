/**
 * Move Routes
 * Handles all operations related to moves in a game
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateGameId, validateMoveData, validateMoveId } = require('../middleware/validation');
const {
  getMovesForGame,
  addMoveToGame,
  getMoveById,
  updateMoveById,
  deleteMoveById
} = require('../controllers/moveController');

const router = express.Router();

// Get all moves for a specific game
router.get('/games/:gameId/moves',
  validateGameId,
  asyncHandler(getMovesForGame)
);

// Add a move to a specific game
router.post('/games/:gameId/moves',
  validateGameId,
  validateMoveData,
  asyncHandler(addMoveToGame)
);

// Get a specific move
router.get('/moves/:moveId',
  validateMoveId,
  asyncHandler(getMoveById)
);

// Update a specific move (e.g. annotate)
router.put('/moves/:moveId',
  validateMoveId,
  validateMoveData, // Optional: or create a separate update validator
  asyncHandler(updateMoveById)
);

// Delete a move (if needed/admin only)
router.delete('/moves/:moveId',
  validateMoveId,
  asyncHandler(deleteMoveById)
);

module.exports = router;
