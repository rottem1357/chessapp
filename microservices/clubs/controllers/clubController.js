const clubService = require('../services/clubService');

function createClub(req, res) {
  const { name, description, ownerId } = req.body;
  const club = clubService.createClub({ name, description, ownerId });
  res.status(201).json(club);
}

function joinClub(req, res) {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const membership = clubService.joinClub(id, userId);
    res.status(201).json(membership);
  } catch (err) {
    if (err.message === 'Club not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

function getClub(req, res) {
  const { id } = req.params;
  const club = clubService.getClub(id);
  if (!club) {
    return res.status(404).json({ error: 'Club not found' });
  }
  res.json(club);
}

module.exports = {
  createClub,
  joinClub,
  getClub
};
