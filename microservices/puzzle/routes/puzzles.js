const express = require('express');
const router = express.Router();
const controller = require('../controllers/puzzleController');
const { validateNextPuzzle } = require('../middleware/validation');

router.get('/next', validateNextPuzzle, controller.getNextPuzzle);

module.exports = router;
