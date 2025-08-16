// microservices/analysis/controllers/analysisController.js
const analysisService = require('../services/analysisService');
const logger = require('../utils/logger');

exports.createJob = async (req, res) => {
  const { gameId } = req.body;
  try {
    const job = await analysisService.createJob(gameId);
    return res.status(202).json({ success: true, jobId: job.jobId, traceId: req.traceId });
  } catch (error) {
    logger.error('Failed to create analysis job', { error: error.message, traceId: req.traceId });
    return res.status(500).json({ success: false, message: error.message, traceId: req.traceId });
  }
};

exports.getAnalysis = async (req, res) => {
  const { gameId } = req.params;

  try {
    const analysis = await analysisService.getAnalysis(gameId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found', traceId: req.traceId });
    }

    return res.json({ success: true, data: analysis, traceId: req.traceId });
  } catch (error) {
    logger.error('Failed to get analysis', { error: error.message, traceId: req.traceId });
    return res.status(500).json({ success: false, message: error.message, traceId: req.traceId });
  }
};
