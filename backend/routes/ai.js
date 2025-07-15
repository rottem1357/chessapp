// routes/ai.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCreateAIGame, validateAIMove, validateAIHint } = require('../middleware/validation');
const aiController = require('../controllers/aiController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Public routes
router.get('/difficulties', asyncHandler(aiController.getDifficulties));

// Protected routes
router.post('/games', verifyToken, validateCreateAIGame, asyncHandler(aiController.createAIGame));
router.get('/games/:gameId', verifyToken, asyncHandler(aiController.getAIGameState));
router.post('/games/:gameId/moves', verifyToken, validateAIMove, asyncHandler(aiController.makeAIMove));
router.post('/games/:gameId/hint', verifyToken, validateAIHint, asyncHandler(aiController.getHint));
router.delete('/games/:gameId', verifyToken, asyncHandler(aiController.endAIGame));

module.exports = router;