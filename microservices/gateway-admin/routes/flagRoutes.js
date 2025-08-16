const express = require('express');
const { putFlag } = require('../controllers/flagController');
const { validateFlagUpdate } = require('../validation/flagValidator');

const router = express.Router();
router.put('/:key', validateFlagUpdate, putFlag);

module.exports = router;
