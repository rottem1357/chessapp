function validateCreateClub(req, res, next) {
  const { name, ownerId } = req.body;
  if (!name || !ownerId) {
    return res.status(400).json({ error: 'name and ownerId are required' });
  }
  next();
}

function validateJoinClub(req, res, next) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  next();
}

module.exports = {
  validateCreateClub,
  validateJoinClub
};
