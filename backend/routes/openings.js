const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllOpenings,
  getOpeningByCode
} = require('../controllers/openingController');

const router = express.Router();

router.get('/openings', asyncHandler(getAllOpenings));
router.get('/openings/:ecoCode', asyncHandler(getOpeningByCode));

module.exports = router;