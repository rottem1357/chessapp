const express = require('express');
const { list } = require('../controllers/registryController');

const router = express.Router();
router.get('/', list);

module.exports = router;
