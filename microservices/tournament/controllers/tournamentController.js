const service = require('../services/tournamentService');
const logger = require('../utils/logger');

async function createTournament(req, res) {
  try {
    const tournament = await service.createTournament(req.body);
    res.status(201).json(tournament);
  } catch (err) {
    logger.error('Failed to create tournament', { error: err.message });
    res.status(400).json({ error: err.message });
  }
}

async function startTournament(req, res) {
  try {
    const pairings = await service.startTournament(req.params.id);
    res.status(200).json({ pairings });
  } catch (err) {
    logger.error('Failed to start tournament', { error: err.message });
    res.status(404).json({ error: err.message });
  }
}

async function getStandings(req, res) {
  try {
    const standings = await service.getStandings(req.params.id);
    res.status(200).json(standings);
  } catch (err) {
    logger.error('Failed to get standings', { error: err.message });
    res.status(404).json({ error: err.message });
  }
}

module.exports = { createTournament, startTournament, getStandings };
