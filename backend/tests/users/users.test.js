const request = require('supertest');
const { app } = require('../../server');
const {
  createTestUser,
  createTestUsers,
  authenticatedRequest,
  expectValidResponse,
  expectErrorResponse,
  expectPaginatedResponse,
  expectValidUUID
} = require('../helpers/testHelpers');

describe('User Endpoints', () => {

  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      await createTestUser({
        username: 'searchuser1',
        display_name: 'Search User One',
        email: 'search1@example.com'
      });
      await createTestUser({
        username: 'searchuser2',
        display_name: 'Search User Two',
        email: 'search2@example.com'
      });
      await createTestUser({
        username: 'differentuser',
        display_name: 'Different User',
        email: 'different@example.com'
      });
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchuser')
        .expect(200);

      expectPaginatedResponse(response);
      expect(response.body.data.users).toHaveLength(2);
      
      response.body.data.users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('rating_blitz');
        expect(user).toHaveProperty('rating_bullet');
        expect(user).toHaveProperty('rating_rapid');
        expect(user).toHaveProperty('rating_puzzle');
        expect(user).toHaveProperty('country');
        expect(user).not.toHaveProperty('email'); // Should not expose email
        expect(user).not.toHaveProperty('password_hash');
      });
    });

    it('should search users with pagination', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchuser&page=1&limit=1')
        .expect(200);

      expectPaginatedResponse(response);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/users/search?q=nonexistent')
        .expect(200);

      expectPaginatedResponse(response);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should fail with too short search query', async () => {
      const response = await request(app)
        .get('/api/users/search?q=ab')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users/search?q=search&page=0&limit=0')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/users/:userId', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'profileuser',
        display_name: 'Profile User',
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
      expect(response.body.data).toHaveProperty('username', user.username);
      expect(user).toHaveProperty('rating_blitz');
      expect(user).toHaveProperty('rating_bullet');
      expect(user).toHaveProperty('rating_rapid');
      expect(user).toHaveProperty('rating_puzzle');
      expect(response.body.data).toHaveProperty('games_played');
      expect(response.body.data).toHaveProperty('games_won');
      expect(response.body.data).toHaveProperty('games_lost');
      expect(response.body.data).toHaveProperty('games_drawn');
      expect(response.body.data).toHaveProperty('country', 'US');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('bio');
      
      // Should not expose sensitive information
      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should fail with invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/users/:userId/stats', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'statsuser',
        display_name: 'Stats User'
      });
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/stats`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('games_played');
      expect(response.body.data).toHaveProperty('games_won');
      expect(response.body.data).toHaveProperty('games_lost');
      expect(response.body.data).toHaveProperty('games_drawn');
      expect(response.body.data).toHaveProperty('win_rate');
      expect(user).toHaveProperty('rating_blitz');
      expect(user).toHaveProperty('rating_bullet');
      expect(user).toHaveProperty('rating_rapid');
      expect(user).toHaveProperty('rating_puzzle');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id/stats')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/users/${fakeId}/stats`)
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/users/:userId/rating-history', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'ratinguser',
        display_name: 'Rating User'
      });
    });

    it('should get rating history', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history`)
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by rating type', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history?rating_type=blitz`)
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history?limit=10`)
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail with invalid rating type', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history?rating_type=invalid`)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with invalid limit', async () => {
      const response = await request(app)
        .get(`/api/users/${user.id}/rating-history?limit=0`)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('PUT /api/users/profile', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'updateuser',
        display_name: 'Update User'
      });
    });

    it('should update user profile with all fields', async () => {
      const updateData = {
        display_name: 'UpdatedName',
        bio: 'Updated bio text',
        country: 'CA'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id', user.id);
      expect(response.body.data).toHaveProperty('username', user.username);
      expect(response.body.data).toHaveProperty('display_name', 'UpdatedName');
      expect(response.body.data).toHaveProperty('bio', 'Updated bio text');
      expect(response.body.data).toHaveProperty('country', 'CA');
    });

    it('should update profile with partial fields', async () => {
      const updateData = {
        display_name: 'PartialUpdate'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('display_name', 'PartialUpdate');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        display_name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);

      expectErrorResponse(response);
    });

    it('should fail with invalid country code', async () => {
      const updateData = {
        country: 'INVALID'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with too long bio', async () => {
      const updateData = {
        bio: 'a'.repeat(501) // Exceeds max length
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with empty display name', async () => {
      const updateData = {
        display_name: ''
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/profile')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/users/preferences', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'prefuser',
        display_name: 'Preferences User'
      });
    });

    it('should get user preferences', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/users/preferences')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('board_theme');
      expect(response.body.data).toHaveProperty('piece_set');
      expect(response.body.data).toHaveProperty('sound_enabled');
      expect(response.body.data).toHaveProperty('show_coordinates');
      expect(response.body.data).toHaveProperty('auto_queen_promotion');
      expect(response.body.data).toHaveProperty('highlight_moves');
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
      user = await createTestUser({
        username: 'prefupdateuser',
        display_name: 'Preferences Update User'
      });
    });

    it('should update all user preferences', async () => {
      const updateData = {
        board_theme: 'blue',
        piece_set: 'modern',
        sound_enabled: false,
        show_coordinates: false,
        auto_queen_promotion: false,
        highlight_moves: true
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('board_theme', 'blue');
      expect(response.body.data).toHaveProperty('piece_set', 'modern');
      expect(response.body.data).toHaveProperty('sound_enabled', false);
      expect(response.body.data).toHaveProperty('show_coordinates', false);
      expect(response.body.data).toHaveProperty('auto_queen_promotion', false);
      expect(response.body.data).toHaveProperty('highlight_moves', true);
    });

    it('should update partial preferences', async () => {
      const updateData = {
        board_theme: 'green',
        sound_enabled: true
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('board_theme', 'green');
      expect(response.body.data).toHaveProperty('sound_enabled', true);
    });

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

    it('should fail with invalid piece set', async () => {
      const updateData = {
        piece_set: 'invalid_set'
      };

      const response = await authenticatedRequest(app, user)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        board_theme: 'blue'
      };

      const response = await request(app)
        .put('/api/users/preferences')
        .send(updateData)
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/users/puzzle-stats', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        username: 'puzzleuser',
        display_name: 'Puzzle User'
      });
    });

    it('should get puzzle statistics', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/users/puzzle-stats')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('total_solved');
      expect(response.body.data).toHaveProperty('total_attempted');
      expect(response.body.data).toHaveProperty('success_rate');
      expect(response.body.data).toHaveProperty('current_rating');
      expect(response.body.data).toHaveProperty('recent_attempts');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/puzzle-stats')
        .expect(401);

      expectErrorResponse(response);
    });
  });
});