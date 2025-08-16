// microservices/analysis/routes/analysis.js
const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { validateCreateJob } = require('../validators/analysisValidator');

router.post('/jobs', validateCreateJob, analysisController.createJob);
router.get('/:gameId', analysisController.getAnalysis);

module.exports = router;
