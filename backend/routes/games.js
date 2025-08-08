// routes/games.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCreateGame,
  validateJoinGame,
  validateMakeMove,
  validateGameQuery,
  validateDrawAction } = require('../middleware/validation');
const gameController = require('../controllers/gameController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/', validateGameQuery, asyncHandler(gameController.getGames));
router.get('/:gameId', optionalAuth, asyncHandler(gameController.getGameDetails));
router.get('/:gameId/moves', asyncHandler(gameController.getMoveHistory));
router.get('/:gameId/opening', asyncHandler(gameController.getGameOpening));

// Protected routes
router.post('/', verifyToken, validateCreateGame, asyncHandler(gameController.createGame));
router.post('/:gameId/join', verifyToken, validateJoinGame, asyncHandler(gameController.joinGame));
router.post('/:gameId/moves', verifyToken, validateMakeMove, asyncHandler(gameController.makeMove));
router.post('/:gameId/resign', verifyToken, asyncHandler(gameController.resignGame));
router.post('/:gameId/draw', verifyToken, asyncHandler(gameController.offerDraw));
router.put('/:gameId/draw', verifyToken, validateDrawAction, asyncHandler(gameController.respondToDraw));
router.get('/:gameId/analysis', verifyToken, asyncHandler(gameController.getGameAnalysis));
router.post('/:gameId/analyze', verifyToken, asyncHandler(gameController.requestAnalysis));

module.exports = router;