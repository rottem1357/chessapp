// routes/games.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCreateGame,
  validateJoinGame,
  validateMakeMove,
  validateGameQuery,
  validateDrawAction,
  handleValidationErrors } = require('../middleware/validation');
const { validators } = require('../middleware/validationBuilders');
const gameController = require('../controllers/gameController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// UUID validation for gameId param
const validateGameId = [
  validators.uuidParam('gameId'),
  handleValidationErrors
];

// Public routes
router.get('/', validateGameQuery, asyncHandler(gameController.getGames));
router.get('/:gameId', validateGameId, optionalAuth, asyncHandler(gameController.getGameDetails));
router.get('/:gameId/moves', validateGameId, asyncHandler(gameController.getMoveHistory));
router.get('/:gameId/opening', validateGameId, asyncHandler(gameController.getGameOpening));

// Protected routes
router.post('/', verifyToken, validateCreateGame, asyncHandler(gameController.createGame));
router.post('/:gameId/join', verifyToken, validateJoinGame, asyncHandler(gameController.joinGame));
router.post('/:gameId/moves', verifyToken, validateMakeMove, asyncHandler(gameController.makeMove));
router.post('/:gameId/resign', verifyToken, validateGameId, asyncHandler(gameController.resignGame));
router.post('/:gameId/draw', verifyToken, validateGameId, asyncHandler(gameController.offerDraw));
router.put('/:gameId/draw', verifyToken, validateDrawAction, asyncHandler(gameController.respondToDraw));
router.get('/:gameId/analysis', verifyToken, validateGameId, asyncHandler(gameController.getGameAnalysis));
router.post('/:gameId/analyze', verifyToken, validateGameId, asyncHandler(gameController.requestAnalysis));

module.exports = router;