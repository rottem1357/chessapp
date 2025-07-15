const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePuzzleData, validatePuzzleAttempt } = require('../middleware/validation');
const {
  listPuzzles,
  createPuzzle,
  getPuzzle,
  submitPuzzleAttempt
} = require('../controllers/puzzleController');

const router = express.Router();

router.get('/puzzles', asyncHandler(listPuzzles));
router.post('/puzzles', validatePuzzleData, asyncHandler(createPuzzle));
router.get('/puzzles/:puzzleId', asyncHandler(getPuzzle));
router.post('/puzzles/:puzzleId/attempt', validatePuzzleAttempt, asyncHandler(submitPuzzleAttempt));

module.exports = router;