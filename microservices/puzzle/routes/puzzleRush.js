const express = require('express');
const router = express.Router();
const controller = require('../controllers/puzzleRushController');
const { validateRushStart, validateRushMove, validateRushFinish } = require('../middleware/validation');

router.post('/start', validateRushStart, controller.start);
router.post('/move', validateRushMove, controller.move);
router.post('/finish', validateRushFinish, controller.finish);

module.exports = router;
