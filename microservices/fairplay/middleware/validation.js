const validateAnalyze = (req, res, next) => {
  const { games } = req.body || {};
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'games array required' });
  }
  for (const game of games) {
    if (typeof game.userId !== 'string') {
      return res.status(400).json({ error: 'game.userId must be a string' });
    }
    if (typeof game.engineMatch !== 'number' || game.engineMatch < 0 || game.engineMatch > 1) {
      return res.status(400).json({ error: 'game.engineMatch must be between 0 and 1' });
    }
  }
  next();
};

const validateReport = (req, res, next) => {
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  next();
};

module.exports = { validateAnalyze, validateReport };
