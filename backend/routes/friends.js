// routes/friends.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateFriendRequest, 
  validateFriendResponse, 
  validateGameChallenge,
  handleValidationErrors
} = require('../middleware/validation');
const { validators } = require('../middleware/validationBuilders');

const friendController = require('../controllers/friendController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// UUID validations for params
const validateRequestId = [validators.uuidParam('requestId'), handleValidationErrors];
const validateFriendId = [validators.uuidParam('friendId'), handleValidationErrors];

// All routes are protected
router.get('/', verifyToken, asyncHandler(friendController.getFriends));
router.post('/requests', verifyToken, validateFriendRequest, asyncHandler(friendController.sendFriendRequest));
router.put('/requests/:requestId', verifyToken, validateRequestId, validateFriendResponse, asyncHandler(friendController.respondToFriendRequest));
router.delete('/:friendId', verifyToken, validateFriendId, asyncHandler(friendController.removeFriend));
router.post('/:friendId/challenge', verifyToken, validateFriendId, validateGameChallenge, asyncHandler(friendController.challengeFriend));

module.exports = router;