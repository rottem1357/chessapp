const express = require('express');
const router = express.Router();
const { registerDevice } = require('../controllers/deviceController');
const validate = require('../validations/deviceValidation');

router.post('/register', validate, registerDevice);

module.exports = router;
