// routes/statistics.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const statisticsController = require('../controllers/statisticsController');

const router = express.Router();

// Public routes
router.get('/global', asyncHandler(statisticsController.getGlobalStats));

module.exports = router;