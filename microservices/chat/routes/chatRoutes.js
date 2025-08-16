const express = require('express');
const { validateHistory, validatePresence } = require('../middleware/validation');
const chatController = require('../controllers/chatController');
const presenceController = require('../controllers/presenceController');

const router = express.Router();

router.get('/chat/history', validateHistory, chatController.getHistory);
router.get('/presence/:user', validatePresence, presenceController.getPresence);

module.exports = router;
