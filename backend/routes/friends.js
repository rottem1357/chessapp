// routes/friends.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateFriendRequest, 
  validateFriendResponse, 
  validateGameChallenge 
} = require('../middleware/validation');
const friendController = require('../controllers/friendController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// All routes are protected
router.get('/', verifyToken, asyncHandler(friendController.getFriends));
router.post('/requests', verifyToken, validateFriendRequest, asyncHandler(friendController.sendFriendRequest));
router.put('/requests/:requestId', verifyToken, validateFriendResponse, asyncHandler(friendController.respondToFriendRequest));
router.delete('/:friendId', verifyToken, asyncHandler(friendController.removeFriend));
router.post('/:friendId/challenge', verifyToken, validateGameChallenge, asyncHandler(friendController.challengeFriend));

module.exports = router;