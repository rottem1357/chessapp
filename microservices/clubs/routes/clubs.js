const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { validateCreateClub, validateJoinClub } = require('../validation/clubValidation');

router.post('/', validateCreateClub, clubController.createClub);
router.post('/:id/join', validateJoinClub, clubController.joinClub);
router.get('/:id', clubController.getClub);

module.exports = router;
