// routes/openings.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateOpeningQuery, handleValidationErrors } = require('../middleware/validation');
const { validators } = require('../middleware/validationBuilders');

const openingController = require('../controllers/openingController');

const router = express.Router();

// UUID validation for openingId param
const validateOpeningId = [
  validators.uuidParam('openingId'),
  handleValidationErrors
];

// Public routes
router.get('/', validateOpeningQuery, asyncHandler(openingController.searchOpenings));
router.get('/:openingId', validateOpeningId, asyncHandler(openingController.getOpeningDetails));

module.exports = router;