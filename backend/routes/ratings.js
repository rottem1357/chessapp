// routes/ratings.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateLeaderboardQuery } = require('../middleware/validation');
const ratingController = require('../controllers/ratingController');

const router = express.Router();

// Public routes
router.get('/leaderboard', validateLeaderboardQuery, asyncHandler(ratingController.getLeaderboard));

module.exports = router;