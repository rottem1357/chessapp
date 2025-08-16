const clubs = new Map();

function create({ id, name, ownerId }) {
  const club = { id, name, ownerId, members: [ownerId] };
  clubs.set(id, club);
  return club;
}

function findById(id) {
  return clubs.get(id);
}

function addMember(clubId, userId) {
  const club = clubs.get(clubId);
  if (!club) return null;
  if (club.members.includes(userId)) return false;
  club.members.push(userId);
  return true;
}

function reset() {
  clubs.clear();
}

module.exports = {
  create,
  findById,
  addMember,
  reset
};
