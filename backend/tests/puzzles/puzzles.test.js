const request = require('supertest');
const { app } = require('../../server');
const {
  createTestUser,
  authenticatedRequest,
  createTestPuzzle,
  expectValidResponse,
  expectErrorResponse
} = require('../helpers/testHelpers');

describe('Puzzle Endpoints', () => {

  describe('GET /api/puzzles/random', () => {
    beforeEach(async () => {
      await createTestPuzzle({ rating: 1200, themes: ['fork', 'pin'] });
      await createTestPuzzle({ rating: 1400, themes: ['skewer', 'mate_in_2'] });
      await createTestPuzzle({ rating: 1600, themes: ['endgame'] });
    });

    it('should get random puzzle', async () => {
      const response = await request(app)
        .get('/api/puzzles/random')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('fen');
      expect(response.body.data).toHaveProperty('rating');
      expect(response.body.data).toHaveProperty('themes');
      expect(response.body.data).not.toHaveProperty('moves'); // Solution should be hidden
    });

    it('should filter by rating range', async () => {
      const response = await request(app)
        .get('/api/puzzles/random?rating=1400')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.rating).toBeGreaterThanOrEqual(1300);
      expect(response.body.data.rating).toBeLessThanOrEqual(1500);
    });

    it('should filter by themes', async () => {
      const response = await request(app)
        .get('/api/puzzles/random?themes=fork,pin')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.themes).toEqual(expect.arrayContaining(['fork']));
    });

    it('should fail with invalid rating', async () => {
      const response = await request(app)
        .get('/api/puzzles/random?rating=5000')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with invalid themes', async () => {
      const response = await request(app)
        .get('/api/puzzles/random?themes=invalid_theme')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/puzzles/categories', () => {
    it('should get puzzle categories', async () => {
      const response = await request(app)
        .get('/api/puzzles/categories')
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/puzzles/:puzzleId/attempt', () => {
    let user, puzzle;

    beforeEach(async () => {
      user = await createTestUser();
      puzzle = await createTestPuzzle({ 
        rating: 1400, 
        themes: ['fork'],
        moves: [['e4', 'e5'], ['Nf3', 'Nc6'], ['Bb5', 'a6']] // Sample solution
      });
    });

    it('should submit puzzle attempt with correct solution', async () => {
      const attemptData = {
        moves: [['e4', 'e5'], ['Nf3', 'Nc6'], ['Bb5', 'a6']],
        time_spent: 30
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('correct', true);
      expect(response.body.data).toHaveProperty('rating_change');
    });

    it('should submit puzzle attempt with incorrect solution', async () => {
      const attemptData = {
        moves: [['e4', 'e6'], ['d4', 'd5']], // Wrong moves
        time_spent: 45
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('correct', false);
      expect(response.body.data).toHaveProperty('rating_change');
    });

    it('should fail with invalid puzzle ID', async () => {
      const attemptData = {
        moves: [['e4', 'e5']],
        time_spent: 30
      };

      const response = await authenticatedRequest(app, user)
        .post('/api/puzzles/invalid-id/attempt')
        .send(attemptData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail without authentication', async () => {
      const attemptData = {
        moves: [['e4', 'e5']],
        time_spent: 30
      };

      const response = await request(app)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/puzzles/stats', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should get user puzzle statistics', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/puzzles/stats')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('total_attempts');
      expect(response.body.data).toHaveProperty('correct_attempts');
      expect(response.body.data).toHaveProperty('current_rating');
      expect(response.body.data).toHaveProperty('accuracy_percentage');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/puzzles/stats')
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/puzzles/history', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should get user puzzle history', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/puzzles/history')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await authenticatedRequest(app, user)
        .get('/api/puzzles/history?page=1&limit=10')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/puzzles/history')
        .expect(401);

      expectErrorResponse(response);
    });
  });
});
