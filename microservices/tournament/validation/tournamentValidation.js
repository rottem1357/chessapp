function validateCreateTournament(req, res, next) {
  const { type, participants } = req.body;
  const errors = [];
  if (!type) errors.push('type is required');
  if (!Array.isArray(participants)) errors.push('participants must be an array');
  if (errors.length) {
    return res.status(400).json({ errors });
  }
  next();
}

function validateStartTournament(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  next();
}

module.exports = { validateCreateTournament, validateStartTournament };
