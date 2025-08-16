const service = require('../services/fairplayService');

const analyze = (req, res) => {
  const { games = [] } = req.body;
  const flagged = service.analyzeGames(games);
  res.json({ flagged });
};

const report = (req, res) => {
  const { userId } = req.body;
  const result = service.reportUser(userId);
  res.json({ flagged: !!result, confidence: result?.confidence || 0 });
};

const getFlagged = (req, res) => {
  res.json({ flagged: service.getFlagged() });
};

module.exports = {
  analyze,
  report,
  getFlagged
};
