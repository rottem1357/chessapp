const profileService = require('../services/profileService');

async function getProfile(req, res) {
  const profile = await profileService.getProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  res.json(profile);
}

async function updateProfile(req, res) {
  const { id } = req.params;
  if (req.userId !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const updated = await profileService.updateProfile(id, req.body);
  res.json(updated);
}

async function getStats(req, res) {
  const stats = await profileService.getStats(req.params.id);
  if (!stats) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  res.json(stats);
}

async function addFriend(req, res) {
  const userId = req.userId;
  const friendId = req.params.id;
  if (userId === friendId) {
    return res.status(400).json({ message: 'Cannot friend yourself' });
  }
  const result = await profileService.addFriend(userId, friendId);
  res.status(201).json(result);
}

module.exports = { getProfile, updateProfile, getStats, addFriend };
