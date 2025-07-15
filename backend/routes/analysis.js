// routes/analysis.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateGameId } = require('../middleware/validation');
const {
  analyzeGame,
  getGameAnalysis
} = require('../controllers/analysisController');

const router = express.Router();

router.post('/games/:gameId/analyze', validateGameId, asyncHandler(analyzeGame));
router.get('/games/:gameId/analysis', validateGameId, asyncHandler(getGameAnalysis));

module.exports = router;