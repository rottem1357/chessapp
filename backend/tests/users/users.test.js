const request = require('supertest');
const app = require('../../server');
const { server } = require('../../server');
const {
  createTestUser,
  createTestUsers,
  authenticatedRequest,
  expectValidResponse,
  expectErrorResponse,
  expectPaginatedResponse
} = require('../helpers/testHelpers');

describe('User Endpoints', () => {

  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      await createTestUser({
        username: 'searchuser1',
        display_name: 'Search User One'
      });
      await createTestUser({
        username: 'searchuser2',
        display_name: 'Search User Two',
        email: 'search2@example.com'
      });
      await createTestUser({
      const response = await request(server)
        display_name: 'Different User',
        email: 'different@example.com'
      });
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users/search?q=search')
      const response = await request(server)

      expectPaginatedResponse(response);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should search users with pagination', async () => {
      const response = await request(app)
        .get('/api/users/search?q=search&limit=1')
      const response = await request(server)

      expectPaginatedResponse(response);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should fail with short search query', async () => {
      const response = await request(app)
      const response = await request(server)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/users/:userId', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'profileuser',
      const response = await request(server)
        bio: 'Test user bio',
        country: 'US'
      });
    });

    it('should get public user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id', user.id);
      const response = await request(server)
      expect(response.body.data).toHaveProperty('display_name', 'Profile User');
      expect(response.body.data).not.toHaveProperty('email'); // Should not expose email
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
      const response = await request(server)

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expectErrorResponse(response, 'PROFILE_FETCH_FAILED');
    });
  });

  describe('GET /api/users/:userId/stats', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        games_played: 50,
        games_won: 25,
        games_lost: 20,
        games_drawn: 5,
      const response = await request(server)
        rating_blitz: 1350,
        rating_bullet: 1300
      });
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/stats`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('games_played', 50);
      expect(response.body.data).toHaveProperty('games_won', 25);
      expect(response.body.data).toHaveProperty('win_rate');
      expect(response.body.data).toHaveProperty('ratings');
      expect(response.body.data.ratings).toHaveProperty('rapid', 1400);
    });
  });

  describe('PUT /api/users/profile', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

      const response = await authenticatedRequest(server, user)
      const updateData = {
        display_name: 'Updated Name',
        bio: 'Updated bio text',
        country: 'CA'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('display_name', 'Updated Name');
      expect(response.body.data).toHaveProperty('bio', 'Updated bio text');
      expect(response.body.data).toHaveProperty('country', 'CA');
      const response = await request(server)

    it('should fail without authentication', async () => {
      const updateData = {
        display_name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);

      expectErrorResponse(response);
      const response = await authenticatedRequest(server, user)

    it('should fail with invalid country code', async () => {
      const updateData = {
        country: 'INVALID'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
      const response = await authenticatedRequest(server, user)

    it('should fail with too long bio', async () => {
      const updateData = {
        bio: 'a'.repeat(501) // Too long
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/users/preferences', () => {
      const response = await authenticatedRequest(server, user)

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should get user preferences', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/users/preferences')
        .expect(200);

      const response = await request(server)
      expect(response.body.data).toHaveProperty('board_theme');
      expect(response.body.data).toHaveProperty('piece_set');
      expect(response.body.data).toHaveProperty('sound_enabled');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/preferences')
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('PUT /api/users/preferences', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should update user preferences', async () => {
      const response = await authenticatedRequest(server, user)
        board_theme: 'brown',
        piece_set: 'modern',
        sound_enabled: false,
        show_coordinates: false
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('board_theme', 'brown');
      expect(response.body.data).toHaveProperty('piece_set', 'modern');
      expect(response.body.data).toHaveProperty('sound_enabled', false);
      const response = await authenticatedRequest(server, user)

    it('should fail with invalid board theme', async () => {
      const updateData = {
        board_theme: 'invalid_theme'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/users/:userId/rating-history', () => {
      const response = await request(server)

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should get rating history', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history`)
      const response = await request(server)

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by rating type', async () => {
      const response = await request(app)
      const response = await request(server)
        .expect(200);

      expectValidResponse(response);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history?limit=10`)
        .expect(200);

      expectValidResponse(response);
    });
  });

  describe('GET /api/users/puzzle-stats', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
      const response = await authenticatedRequest(server, user)
        puzzles_attempted: 150,
        rating_puzzle: 1300
      });
    });

    it('should get puzzle statistics', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/users/puzzle-stats')
        .expect(200);

      const response = await request(server)
      expect(response.body.data).toHaveProperty('puzzles_solved');
      expect(response.body.data).toHaveProperty('puzzles_attempted');
      expect(response.body.data).toHaveProperty('success_rate');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/puzzle-stats')
        .expect(401);

      expectErrorResponse(response);
    });
  });
});
