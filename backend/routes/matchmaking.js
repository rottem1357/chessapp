// routes/matchmaking.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateJoinQueue } = require('../middleware/validation');
const matchmakingController = require('../controllers/matchmakingController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// All routes are protected
router.post('/queue', verifyToken, validateJoinQueue, asyncHandler(matchmakingController.joinQueue));
router.delete('/queue', verifyToken, asyncHandler(matchmakingController.leaveQueue));
router.get('/status', verifyToken, asyncHandler(matchmakingController.getQueueStatus));

module.exports = router;