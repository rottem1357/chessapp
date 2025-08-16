const { tournaments } = require('../db');

function create(tournament) {
  tournaments.set(tournament.id, tournament);
  return tournament;
}

function findById(id) {
  return tournaments.get(id);
}

function update(id, data) {
  const existing = tournaments.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  tournaments.set(id, updated);
  return updated;
}

module.exports = { create, findById, update };
