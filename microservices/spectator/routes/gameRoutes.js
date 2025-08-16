const express = require('express');
const { validateGameState, validateMoves } = require('../validation/gameValidation');
const { getGameState, getMoves } = require('../controllers/gameController');

const router = express.Router();

router.get('/:id/state', validateGameState, getGameState);
router.get('/:id/moves', validateMoves, getMoves);

module.exports = router;
