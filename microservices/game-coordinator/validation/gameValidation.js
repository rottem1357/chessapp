function validateCreateGame(req, res, next) {
  const { gameId } = req.body;
  if (!gameId) {
    return res.status(400).json({ error: 'gameId required' });
  }
  next();
}

function validateGetRouting(req, res, next) {
  const { gameId } = req.params;
  if (!gameId) {
    return res.status(400).json({ error: 'gameId required' });
  }
  next();
}

module.exports = { validateCreateGame, validateGetRouting };
