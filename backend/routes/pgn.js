const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateGameId, validatePGNUpload } = require('../middleware/validation');
const {
  importPGN,
  exportPGN
} = require('../controllers/pgnController');

const router = express.Router();

router.post('/pgn/import', validatePGNUpload, asyncHandler(importPGN));
router.get('/games/:gameId/pgn', validateGameId, asyncHandler(exportPGN));

module.exports = router;