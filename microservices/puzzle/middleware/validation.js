function validateNextPuzzle(req, res, next) {
  if (!req.query.userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  next();
}

function validateRushStart(req, res, next) {
  if (!req.body.userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  next();
}

function validateRushMove(req, res, next) {
  const { sessionId, correct } = req.body;
  if (!sessionId || typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'sessionId and correct required' });
  }
  next();
}

function validateRushFinish(req, res, next) {
  if (!req.body.sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }
  next();
}

module.exports = {
  validateNextPuzzle,
  validateRushStart,
  validateRushMove,
  validateRushFinish,
};
