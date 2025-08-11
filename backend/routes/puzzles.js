// routes/puzzles.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePuzzleQuery, validatePuzzleAttempt, handleValidationErrors } = require('../middleware/validation');
const { validators } = require('../middleware/validationBuilders');
const puzzleController = require('../controllers/puzzleController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// UUID validation for puzzleId param
const validatePuzzleId = [
  validators.uuidParam('puzzleId'),
  handleValidationErrors
];

// Public routes
router.get('/random', validatePuzzleQuery, optionalAuth, asyncHandler(puzzleController.getRandomPuzzle));
router.get('/categories', asyncHandler(puzzleController.getCategories));
// Protected user routes (must be before :puzzleId)
router.get('/stats', verifyToken, asyncHandler(puzzleController.getUserStats));
router.get('/history', verifyToken, asyncHandler(puzzleController.getUserHistory));

// Param routes
router.get('/:puzzleId', validatePuzzleId, optionalAuth, asyncHandler(puzzleController.getPuzzleById));
router.post('/:puzzleId/attempt', validatePuzzleId, verifyToken, validatePuzzleAttempt, asyncHandler(puzzleController.submitAttempt));

module.exports = router;
