const ratingService = require('../services/ratingService');

const getRatings = (req, res) => {
  const { userId } = req.params;
  const ratings = ratingService.getRatings(userId);
  if (!ratings) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ userId, ratings });
};

const recalcRatings = (req, res) => {
  const { pool } = req.body || {};
  ratingService.recalculate(pool);
  return res.json({ status: 'recalculated' });
};

module.exports = { getRatings, recalcRatings };
