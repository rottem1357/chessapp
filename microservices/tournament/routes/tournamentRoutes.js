const express = require('express');
const { validateCreateTournament, validateStartTournament } = require('../validation/tournamentValidation');
const controller = require('../controllers/tournamentController');

const router = express.Router();

router.post('/', validateCreateTournament, controller.createTournament);
router.post('/:id/start', validateStartTournament, controller.startTournament);
router.get('/:id/standings', controller.getStandings);

module.exports = router;
