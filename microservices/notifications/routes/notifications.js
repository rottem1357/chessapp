const express = require('express');
const router = express.Router();
const { notify } = require('../controllers/notificationController');
const validate = require('../validations/notificationValidation');

router.post('/', validate, notify);

module.exports = router;
