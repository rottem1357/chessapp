// routes/ai.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCreateAIGame, validateAIMove, validateAIHint, handleValidationErrors } = require('../middleware/validation');
const { validators } = require('../middleware/validationBuilders');

const aiController = require('../controllers/aiController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// UUID validation for gameId param
const validateAIGameId = [
  validators.uuidParam('gameId'),
  handleValidationErrors
];

// Public routes
router.get('/difficulties', asyncHandler(aiController.getDifficulties));

// Protected routes
router.post('/games', verifyToken, validateCreateAIGame, asyncHandler(aiController.createAIGame));
router.get('/games/:gameId', verifyToken, validateAIGameId, asyncHandler(aiController.getAIGameState));
router.post('/games/:gameId/moves', verifyToken, validateAIGameId, validateAIMove, asyncHandler(aiController.makeAIMove));
router.post('/games/:gameId/hint', verifyToken, validateAIGameId, validateAIHint, asyncHandler(aiController.getHint));
router.delete('/games/:gameId', verifyToken, validateAIGameId, asyncHandler(aiController.endAIGame));

module.exports = router;