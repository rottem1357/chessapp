// controllers/friendController.js
const friendService = require('../services/friendService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get user's friends list
 */
async function getFriends(req, res) {
  try {
    const userId = req.user.id;
    const { status = 'accepted' } = req.query;

    logger.info('Friends list request', { 
      userId, 
      status
    });

    const result = await friendService.getFriends(userId, status);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Friends list retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get friends list', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'FRIENDS_LIST_FAILED')
    );
  }
}

/**
 * Send friend request
 */
async function sendFriendRequest(req, res) {
  try {
    const requesterId = req.user.id;
    const { user_id: addresseeId, message } = req.body;

    logger.info('Friend request sent', { 
      requesterId, 
      addresseeId,
      hasMessage: !!message
    });

    const result = await friendService.sendFriendRequest(requesterId, addresseeId, message);

    logger.info('Friend request sent successfully', { 
      requesterId, 
      addresseeId,
      friendshipId: result.id
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, result, 'Friend request sent successfully')
    );
  } catch (error) {
    logger.error('Failed to send friend request', { 
      error: error.message, 
      requesterId: req.user?.id,
      addresseeId: req.body.user_id
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('already') || error.message.includes('Cannot') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'FRIEND_REQUEST_FAILED')
    );
  }
}

/**
 * Respond to friend request
 */
async function respondToFriendRequest(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'decline'

    logger.info('Friend request response', { 
      requestId, 
      userId,
      action
    });

    const result = await friendService.respondToFriendRequest(requestId, userId, action);

    logger.info('Friend request response processed', { 
      requestId, 
      userId,
      action,
      status: result.status
    });

    const message = action === 'accept' ? 
      'Friend request accepted successfully' : 
      'Friend request declined successfully';

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, message)
    );
  } catch (error) {
    logger.error('Failed to respond to friend request', { 
      error: error.message, 
      requestId: req.params.requestId,
      userId: req.user?.id,
      action: req.body.action
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : 
      error.message.includes('not authorized') || error.message.includes('no longer') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'FRIEND_RESPONSE_FAILED')
    );
  }
}

/**
 * Remove friend
 */
async function removeFriend(req, res) {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    logger.info('Friend removal request', { 
      userId, 
      friendId
    });

    const result = await friendService.removeFriend(userId, friendId);

    logger.info('Friend removed successfully', { 
      userId, 
      friendId
    });

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Friend removed successfully')
    );
  } catch (error) {
    logger.error('Failed to remove friend', { 
      error: error.message, 
      userId: req.user?.id,
      friendId: req.params.friendId
    });

    const statusCode = error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'FRIEND_REMOVAL_FAILED')
    );
  }
}

/**
 * Challenge friend to a game
 */
async function challengeFriend(req, res) {
  try {
    const challengerId = req.user.id;
    const { friendId } = req.params;
    const { game_type, time_control, color, is_rated, message } = req.body;

    logger.info('Friend challenge request', { 
      challengerId, 
      friendId,
      game_type,
      time_control,
      color
    });

    const challengeData = {
      game_type,
      time_control,
      color: color || 'random',
      is_rated: is_rated !== false,
      message
    };

    const result = await friendService.challengeFriend(challengerId, friendId, challengeData);

    logger.info('Friend challenge sent successfully', { 
      challengerId, 
      friendId,
      invitationId: result.invitationId
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatResponse(true, result, 'Challenge sent successfully')
    );
  } catch (error) {
    logger.error('Failed to challenge friend', { 
      error: error.message, 
      challengerId: req.user?.id,
      friendId: req.params.friendId,
      challengeData: req.body
    });

    const statusCode = error.message.includes('not friends') ? 
      HTTP_STATUS.BAD_REQUEST : 
      error.message.includes('not found') ? 
      HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'FRIEND_CHALLENGE_FAILED')
    );
  }
}

/**
 * Get pending friend requests
 */
async function getPendingRequests(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Pending friend requests request', { userId });

    const result = await friendService.getPendingRequests(userId);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Pending requests retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get pending requests', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'PENDING_REQUESTS_FAILED')
    );
  }
}

/**
 * Get sent friend requests
 */
async function getSentRequests(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Sent friend requests request', { userId });

    // Get pending requests where user is the requester
    const result = await friendService.getFriends(userId, 'pending');
    
    // Filter to only show requests sent by this user
    const sentRequests = result.filter(friendship => 
      friendship.user.id !== userId // The "friend" in the result is the addressee
    );

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, sentRequests, 'Sent requests retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get sent requests', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'SENT_REQUESTS_FAILED')
    );
  }
}

/**
 * Block user (placeholder)
 */
async function blockUser(req, res) {
  try {
    const userId = req.user.id;
    const { user_id: targetUserId } = req.body;

    logger.info('Block user request', { 
      userId, 
      targetUserId
    });

    // TODO: Implement user blocking functionality
    // This would involve:
    // - Adding block relationship
    // - Preventing future friend requests
    // - Hiding from matchmaking
    // - Removing from friends if already friends
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'User blocking not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to block user', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_BLOCK_FAILED')
    );
  }
}

/**
 * Unblock user (placeholder)
 */
async function unblockUser(req, res) {
  try {
    const userId = req.user.id;
    const { blockedUserId } = req.params;

    logger.info('Unblock user request', { 
      userId, 
      blockedUserId
    });

    // TODO: Implement user unblocking functionality
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'User unblocking not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to unblock user', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_UNBLOCK_FAILED')
    );
  }
}

/**
 * Get blocked users list (placeholder)
 */
async function getBlockedUsers(req, res) {
  try {
    const userId = req.user.id;

    logger.info('Blocked users list request', { userId });

    // TODO: Implement getting blocked users list
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Blocked users list not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get blocked users', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'BLOCKED_USERS_FAILED')
    );
  }
}

/**
 * Get friend activity feed (placeholder)
 */
async function getFriendActivity(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    logger.info('Friend activity request', { 
      userId, 
      limit
    });

    // TODO: Implement friend activity feed
    // This could show:
    // - Friends' recent games
    // - Rating changes
    // - Achievements unlocked
    // - Puzzle solving streaks
    // - Online status
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Friend activity feed not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get friend activity', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'FRIEND_ACTIVITY_FAILED')
    );
  }
}

module.exports = {
  getFriends,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  challengeFriend,
  getPendingRequests,
  getSentRequests,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getFriendActivity
};
