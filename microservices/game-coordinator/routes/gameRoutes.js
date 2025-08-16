const express = require('express');
const router = express.Router();
const { createGame, getRouting } = require('../controllers/gameController');
const { validateCreateGame, validateGetRouting } = require('../validation/gameValidation');

router.post('/games', validateCreateGame, createGame);
router.get('/routing/:gameId', validateGetRouting, getRouting);

module.exports = router;
