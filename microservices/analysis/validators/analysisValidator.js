// microservices/analysis/validators/analysisValidator.js

exports.validateCreateJob = (req, res, next) => {
  const { gameId } = req.body;
  if (!gameId) {
    return res.status(400).json({ success: false, message: 'gameId required', traceId: req.traceId });
  }
  next();
};
