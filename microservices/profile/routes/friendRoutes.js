const express = require('express');
const controller = require('../controllers/profileController');

const router = express.Router();

router.post('/:id', controller.addFriend);

module.exports = router;
