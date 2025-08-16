const { v4: uuidv4 } = require('uuid');
const model = require('../models/tournamentModel');
const { generateArenaPairings } = require('./pairingService');
const events = require('../utils/eventBus');

async function createTournament({ type, participants = [] }) {
  const tournament = {
    id: uuidv4(),
    type,
    participants,
    status: 'pending',
    pairings: [],
    results: [],
  };
  return model.create(tournament);
}

async function startTournament(id) {
  const tournament = model.findById(id);
  if (!tournament) throw new Error('Tournament not found');
  const pairings = generateArenaPairings(tournament.participants);
  tournament.pairings = pairings;
  tournament.status = 'ongoing';
  model.update(id, tournament);
  events.emit('tournament.pairings', { tournamentId: id, pairings });
  return pairings;
}

async function getStandings(id) {
  const tournament = model.findById(id);
  if (!tournament) throw new Error('Tournament not found');
  return { results: tournament.results };
}

module.exports = { createTournament, startTournament, getStandings };
