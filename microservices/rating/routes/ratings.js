const express = require('express');
const router = express.Router();
const controller = require('../controllers/ratingsController');
const validators = require('../validation/ratingsValidation');

router.get('/:userId', validators.getRatings, controller.getRatings);
router.post('/recalc', validators.recalcRatings, controller.recalcRatings);

module.exports = router;
