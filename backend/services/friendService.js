// services/friendService.js
const db = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class FriendService {
  /**
   * Send friend request
   */
  async sendFriendRequest(requesterId, addresseeId, message) {
    const transaction = await db.sequelize.transaction();
    
    try {
      if (requesterId === addresseeId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if users exist
      const [requester, addressee] = await Promise.all([
        db.User.findByPk(requesterId, { transaction }),
        db.User.findByPk(addresseeId, { transaction })
      ]);

      if (!requester || !addressee) {
        throw new Error('User not found');
      }

      // Check if friendship already exists
      const existingFriendship = await db.Friendship.findOne({
        where: {
          [Op.or]: [
            { requester_id: requesterId, addressee_id: addresseeId },
            { requester_id: addresseeId, addressee_id: requesterId }
          ]
        },
        transaction
      });

      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          throw new Error('You are already friends');
        } else if (existingFriendship.status === 'pending') {
          throw new Error('Friend request already sent');
        } else if (existingFriendship.status === 'blocked') {
          throw new Error('Cannot send friend request');
        }
      }

      // Create friend request
      const friendship = await db.Friendship.create({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      }, { transaction });

      await transaction.commit();

      logger.info('Friend request sent', { requesterId, addresseeId });

      return {
        id: friendship.id,
        status: 'pending',
        message: 'Friend request sent successfully'
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to send friend request', { error: error.message, requesterId, addresseeId });
      throw error;
    }
  }

  /**
   * Respond to friend request
   */
  async respondToFriendRequest(requestId, userId, action) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const friendship = await db.Friendship.findByPk(requestId, { transaction });
      
      if (!friendship) {
        throw new Error('Friend request not found');
      }

      if (friendship.addressee_id !== userId) {
        throw new Error('You are not authorized to respond to this request');
      }

      if (friendship.status !== 'pending') {
        throw new Error('Friend request is no longer pending');
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      
      await db.Friendship.update({
        status: newStatus,
        updated_at: new Date()
      }, {
        where: { id: requestId },
        transaction
      });

      await transaction.commit();

      logger.info('Friend request responded', { requestId, userId, action });

      return {
        status: newStatus,
        message: `Friend request ${action}ed successfully`
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to respond to friend request', { error: error.message, requestId, userId });
      throw error;
    }
  }

  /**
   * Get user's friends list
   */
  async getFriends(userId, status = 'accepted') {
    try {
      const friendships = await db.Friendship.findAll({
        where: {
          [Op.or]: [
            { requester_id: userId },
            { addressee_id: userId }
          ],
          status: status
        },
        include: [
          {
            model: db.User,
            as: 'requester',
            attributes: ['id', 'username', 'display_name', 'avatar_url', 'rating_rapid']
          },
          {
            model: db.User,
            as: 'addressee',
            attributes: ['id', 'username', 'display_name', 'avatar_url', 'rating_rapid']
          }
        ],
        order: [['updated_at', 'DESC']]
      });

      const friends = friendships.map(friendship => {
        const friend = friendship.requester_id === userId ? 
          friendship.addressee : friendship.requester;
        
        return {
          friendshipId: friendship.id,
          user: friend,
          since: friendship.updated_at,
          status: friendship.status
        };
      });

      return friends;
    } catch (error) {
      logger.error('Failed to get friends list', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(userId, friendId) {
    try {
      const friendship = await db.Friendship.findOne({
        where: {
          [Op.or]: [
            { requester_id: userId, addressee_id: friendId },
            { requester_id: friendId, addressee_id: userId }
          ]
        }
      });

      if (!friendship) {
        throw new Error('Friendship not found');
      }

      await db.Friendship.destroy({
        where: { id: friendship.id }
      });

      logger.info('Friend removed', { userId, friendId });

      return { message: 'Friend removed successfully' };
    } catch (error) {
      logger.error('Failed to remove friend', { error: error.message, userId, friendId });
      throw error;
    }
  }

  /**
   * Challenge friend to a game
   */
  async challengeFriend(challengerId, friendId, challengeData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Verify friendship
      const friendship = await db.Friendship.findOne({
        where: {
          [Op.or]: [
            { requester_id: challengerId, addressee_id: friendId },
            { requester_id: friendId, addressee_id: challengerId }
          ],
          status: 'accepted'
        },
        transaction
      });

      if (!friendship) {
        throw new Error('You are not friends with this user');
      }

      // Create game invitation
      const invitation = await db.GameInvitation.create({
        inviter_id: challengerId,
        invitee_id: friendId,
        game_type: challengeData.game_type,
        time_control: challengeData.time_control,
        inviter_color: challengeData.color || 'random',
        is_rated: challengeData.is_rated !== false,
        message: challengeData.message || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }, { transaction });

      await transaction.commit();

      logger.info('Friend challenged to game', { challengerId, friendId, invitationId: invitation.id });

      return {
        invitationId: invitation.id,
        message: 'Challenge sent successfully'
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to challenge friend', { error: error.message, challengerId, friendId });
      throw error;
    }
  }

  /**
   * Get pending friend requests
   */
  async getPendingRequests(userId) {
    try {
      const pendingRequests = await db.Friendship.findAll({
        where: {
          addressee_id: userId,
          status: 'pending'
        },
        include: [{
          model: db.User,
          as: 'requester',
          attributes: ['id', 'username', 'display_name', 'avatar_url', 'rating_rapid']
        }],
        order: [['created_at', 'DESC']]
      });

      return pendingRequests.map(request => ({
        id: request.id,
        requester: request.requester,
        created_at: request.created_at
      }));
    } catch (error) {
      logger.error('Failed to get pending requests', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new FriendService();
