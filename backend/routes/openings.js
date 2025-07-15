// routes/openings.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateOpeningQuery } = require('../middleware/validation');
const openingController = require('../controllers/openingController');

const router = express.Router();

// Public routes
router.get('/', validateOpeningQuery, asyncHandler(openingController.searchOpenings));
router.get('/:openingId', asyncHandler(openingController.getOpeningDetails));

module.exports = router;