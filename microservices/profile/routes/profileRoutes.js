const express = require('express');
const controller = require('../controllers/profileController');

const router = express.Router();

router.get('/:id', controller.getProfile);
router.put('/:id', controller.updateProfile);
router.get('/:id/stats', controller.getStats);

module.exports = router;
