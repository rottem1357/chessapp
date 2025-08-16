const express = require('express');
const { health, ready } = require('../controllers/healthController');

const router = express.Router();
router.get('/healthz', health);
router.get('/readyz', ready);

module.exports = router;
