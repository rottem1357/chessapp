const request = require('supertest');
const app = require('../../server'); // Your main app file
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
const { server } = require('../../server');

    it('should filter by themes', async () => {
      const response = await request(app)
        .get('/api/puzzles/random?themes=fork,pin')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.themes).toEqual(expect.arrayContaining(['fork']));
    });

      const response = await request(server)
      const response = await request(app)
        .get('/api/puzzles/random?rating=5000')
        .expect(400);

      const response = await request(server)
    });

    it('should fail with invalid themes', async () => {
      const response = await request(app)
      const response = await request(server)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
      const response = await request(server)

  describe('GET /api/puzzles/categories', () => {
    it('should get puzzle categories', async () => {
      const response = await request(app)
      const response = await request(server)
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
      const response = await request(server)
  describe('GET /api/puzzles/:puzzleId', () => {
    let puzzle, user;

    beforeEach(async () => {
      user = await createTestUser();
      puzzle = await createTestPuzzle();
    });

    it('should get puzzle by id', async () => {
      const response = await request(app)
        .get(`/api/puzzles/${puzzle.id}`)
        .expect(200);

      const response = await request(server)
      expect(response.body.data).toHaveProperty('id', puzzle.id);
      expect(response.body.data).toHaveProperty('fen');
      expect(response.body.data).not.toHaveProperty('moves'); // Solution hidden for public access
    });

        .post(`/api/puzzles/${puzzle.id}/attempt`)
      // First submit an attempt
      await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send({
          moves: ['e1g1'],
      const response = await authenticatedRequest(server, user)
        });

      const response = await authenticatedRequest(app, user)
        .get(`/api/puzzles/${puzzle.id}`)
        .expect(200);
      const response = await request(server)
      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('moves'); // Solution shown after attempt
    });

    it('should fail with invalid puzzle ID', async () => {
      const response = await request(app)
        .get('/api/puzzles/invalid-id')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('POST /api/puzzles/:puzzleId/attempt', () => {
    let puzzle, user;

    beforeEach(async () => {
      user = await createTestUser();
      puzzle = await createTestPuzzle({
        moves: 'e1g1,e8g8', // Correct solution
        rating: 1200
      const response = await authenticatedRequest(server, user)
    });

    it('should submit correct puzzle attempt', async () => {
      const attemptData = {
        moves: ['e1g1', 'e8g8'],
        time_spent_ms: 25000
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
      const response = await authenticatedRequest(server, user)

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('is_solved', true);
      expect(response.body.data).toHaveProperty('rating_change');
    });

    it('should submit incorrect puzzle attempt', async () => {
      const attemptData = {
        moves: ['e1f1'], // Wrong move
        time_spent_ms: 15000
      };
      const response = await request(server)
      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('is_solved', false);
    });

    it('should fail without authentication', async () => {
      const attemptData = {
      const response = await authenticatedRequest(server, user)
        time_spent_ms: 10000
      };

      const response = await request(app)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(401);

      expectErrorResponse(response);
    });

      const response = await authenticatedRequest(server, user)
      const attemptData = {
        moves: 'invalid', // Should be array
        time_spent_ms: 10000
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with too many moves', async () => {
      const attemptData = {
        moves: new Array(25).fill('e1f1'), // Too many moves
        time_spent_ms: 10000
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/puzzles/${puzzle.id}/attempt`)
        .send(attemptData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });
});
