const express = require('express');
const router = express.Router();
const controller = require('../controllers/puzzleRushController');

router.get('/puzzle-rush', controller.leaderboard);

module.exports = router;
