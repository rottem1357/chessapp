const express = require('express');
const { validateGameId } = require('../validations/gameValidation');
const { handleValidation } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.get('/:id', validateGameId, handleValidation, asyncHandler(gameController.getGame));
router.post('/:id/admin/end', validateGameId, handleValidation, asyncHandler(gameController.endGame));

module.exports = router;
