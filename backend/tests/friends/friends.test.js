const request = require('supertest');
const { app } = require('../../server'); // Your main app file
const {
  createTestUser,
  createTestUsers,
  authenticatedRequest,
  createTestFriendship,
  expectValidResponse,
  expectErrorResponse
} = require('../helpers/testHelpers');

describe('Friends Endpoints', () => {

  describe('GET /api/friends', () => {
    let user1, user2, user3;

    beforeEach(async () => {
      [user1, user2, user3] = await createTestUsers(3);
      
      // Create some friendships
      await createTestFriendship(user1.id, user2.id, 'accepted');
      await createTestFriendship(user3.id, user1.id, 'pending');
    });

    it('should get user friends list', async () => {
      const response = await authenticatedRequest(app, user1)
        .get('/api/friends')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('friends');
      expect(response.body.data).toHaveProperty('pendingRequests');
      expect(response.body.data.friends).toHaveLength(1);
      expect(response.body.data.pendingRequests).toHaveLength(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/friends')
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/friends/requests', () => {
    let user1, user2;

    beforeEach(async () => {
      [user1, user2] = await createTestUsers(2);
    });

    it('should send friend request', async () => {
      const requestData = {
        user_id: user2.id,
        message: 'Hello, let\'s be friends!'
      };

      const response = await authenticatedRequest(app, user1)
        .post('/api/friends/requests')
        .send(requestData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('requester_id', user1.id);
      expect(response.body.data).toHaveProperty('addressee_id', user2.id);
      expect(response.body.data).toHaveProperty('status', 'pending');
    });

    it('should fail to send duplicate request', async () => {
      // Create existing friendship
      await createTestFriendship(user1.id, user2.id, 'pending');

      const requestData = {
        user_id: user2.id
      };

      const response = await authenticatedRequest(app, user1)
        .post('/api/friends/requests')
        .send(requestData)
        .expect(400);

      expectErrorResponse(response);
    });

    it('should fail to send request to self', async () => {
      const requestData = {
        user_id: user1.id
      };

      const response = await authenticatedRequest(app, user1)
        .post('/api/friends/requests')
        .send(requestData)
        .expect(400);

      expectErrorResponse(response);
    });

    it('should fail with invalid user ID', async () => {
      const requestData = {
        user_id: 'invalid-id'
      };

      const response = await authenticatedRequest(app, user1)
        .post('/api/friends/requests')
        .send(requestData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('PUT /api/friends/requests/:requestId', () => {
    let user1, user2, friendship;

    beforeEach(async () => {
      [user1, user2] = await createTestUsers(2);
      friendship = await createTestFriendship(user1.id, user2.id, 'pending');
    });

    it('should accept friend request', async () => {
      const response = await authenticatedRequest(app, user2)
        .put(`/api/friends/requests/${friendship.id}`)
        .send({ action: 'accept' })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('status', 'accepted');
    });

    it('should decline friend request', async () => {
      const response = await authenticatedRequest(app, user2)
        .put(`/api/friends/requests/${friendship.id}`)
        .send({ action: 'decline' })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('status', 'declined');
    });

    it('should fail to respond to own request', async () => {
      const response = await authenticatedRequest(app, user1)
        .put(`/api/friends/requests/${friendship.id}`)
        .send({ action: 'accept' })
        .expect(403);

      expectErrorResponse(response);
    });

    it('should fail with invalid action', async () => {
      const response = await authenticatedRequest(app, user2)
        .put(`/api/friends/requests/${friendship.id}`)
        .send({ action: 'invalid' })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('DELETE /api/friends/:friendId', () => {
    let user1, user2, friendship;

    beforeEach(async () => {
      [user1, user2] = await createTestUsers(2);
      friendship = await createTestFriendship(user1.id, user2.id, 'accepted');
    });

    it('should remove friend successfully', async () => {
      const response = await authenticatedRequest(app, user1)
        .delete(`/api/friends/${user2.id}`)
        .expect(200);

      expectValidResponse(response);
    });

    it('should fail to remove non-friend', async () => {
      const user3 = await createTestUser({
        username: 'user3',
        email: 'user3@example.com'
      });

      const response = await authenticatedRequest(app, user1)
        .delete(`/api/friends/${user3.id}`)
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/friends/:friendId/challenge', () => {
    let user1, user2;

    beforeEach(async () => {
      [user1, user2] = await createTestUsers(2);
      await createTestFriendship(user1.id, user2.id, 'accepted');
    });

    it('should challenge friend to game', async () => {
      const challengeData = {
        game_type: 'blitz',
        time_control: '5+0',
        color: 'white',
        message: 'Let\'s play!'
      };

      const response = await authenticatedRequest(app, user1)
        .post(`/api/friends/${user2.id}/challenge`)
        .send(challengeData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('inviter_id', user1.id);
      expect(response.body.data).toHaveProperty('invitee_id', user2.id);
      expect(response.body.data).toHaveProperty('game_type', 'blitz');
    });

    it('should fail to challenge non-friend', async () => {
      const user3 = await createTestUser({
        username: 'user3',
        email: 'user3@example.com'
      });

      const challengeData = {
        game_type: 'rapid',
        time_control: '10+0'
      };

      const response = await authenticatedRequest(app, user1)
        .post(`/api/friends/${user3.id}/challenge`)
        .send(challengeData)
        .expect(403);

      expectErrorResponse(response);
    });

    it('should fail with invalid time control', async () => {
      const challengeData = {
        game_type: 'blitz',
        time_control: 'invalid'
      };

      const response = await authenticatedRequest(app, user1)
        .post(`/api/friends/${user2.id}/challenge`)
        .send(challengeData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });
});
