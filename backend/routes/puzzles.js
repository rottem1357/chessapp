// routes/puzzles.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePuzzleQuery, validatePuzzleAttempt } = require('../middleware/validation');
const puzzleController = require('../controllers/puzzleController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/random', validatePuzzleQuery, optionalAuth, asyncHandler(puzzleController.getRandomPuzzle));
router.get('/categories', asyncHandler(puzzleController.getCategories));
router.get('/:puzzleId', optionalAuth, asyncHandler(puzzleController.getPuzzleById));

// Protected routes
router.post('/:puzzleId/attempt', verifyToken, validatePuzzleAttempt, asyncHandler(puzzleController.submitAttempt));

module.exports = router;
