const { v4: uuidv4 } = require('uuid');
const clubModel = require('../models/clubModel');

function createClub({ name, description, ownerId }) {
  const id = uuidv4();
  return clubModel.create({ id, name, ownerId, description: description || '' });
}

function joinClub(clubId, userId) {
  const result = clubModel.addMember(clubId, userId);
  if (result === null) {
    throw new Error('Club not found');
  }
  if (result === false) {
    throw new Error('User already a member');
  }
  return { clubId, userId };
}

function getClub(clubId) {
  return clubModel.findById(clubId);
}

function reset() {
  clubModel.reset();
}

module.exports = {
  createClub,
  joinClub,
  getClub,
  _reset: reset
};
