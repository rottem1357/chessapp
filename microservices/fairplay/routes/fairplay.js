const express = require('express');
const controller = require('../controllers/fairplayController');
const { validateAnalyze, validateReport } = require('../middleware/validation');

const router = express.Router();

router.post('/analyze', validateAnalyze, controller.analyze);
router.post('/report', validateReport, controller.report);
router.get('/flagged', controller.getFlagged);

module.exports = router;
