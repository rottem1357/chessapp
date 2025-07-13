/**
 * Basic API Tests
 * Simple tests to verify API endpoints work correctly
 */

const request = require('supertest');
const { app } = require('../server');

describe('Basic API Endpoints', () => {
  describe('GET /', () => {
    it('should return server information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'healthy');
    });
  });

  describe('GET /api/games', () => {
    it('should return games list', async () => {
      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('games');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/ai/difficulties', () => {
    it('should return AI difficulty levels', async () => {
      const response = await request(app)
        .get('/api/ai/difficulties')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
});

describe('AI Game API', () => {
  let gameId;

  describe('POST /api/ai/game/new', () => {
    it('should create a new AI game', async () => {
      const response = await request(app)
        .post('/api/ai/game/new')
        .send({
          difficulty: 'beginner',
          playerColor: 'white',
          playerId: 'test-player'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.difficulty).toBe('beginner');
      expect(response.body.data.playerColor).toBe('white');

      gameId = response.body.data.id;
    });
  });

  describe('GET /api/ai/game/:gameId', () => {
    it('should return AI game state', async () => {
      if (!gameId) {
        // Create a game first
        const createResponse = await request(app)
          .post('/api/ai/game/new')
          .send({ difficulty: 'beginner', playerColor: 'white' });
        gameId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/ai/game/${gameId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', gameId);
      expect(response.body.data).toHaveProperty('fen');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/ai/game/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/game/:gameId/move', () => {
    it('should make a valid move', async () => {
      if (!gameId) {
        // Create a game first
        const createResponse = await request(app)
          .post('/api/ai/game/new')
          .send({ difficulty: 'beginner', playerColor: 'white' });
        gameId = createResponse.body.data.id;
      }

      const response = await request(app)
        .post(`/api/ai/game/${gameId}/move`)
        .send({ move: 'e4' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('playerMove');
      expect(response.body.data.playerMove.san).toBe('e4');
    });

    it('should reject invalid move', async () => {
      if (!gameId) {
        // Create a game first
        const createResponse = await request(app)
          .post('/api/ai/game/new')
          .send({ difficulty: 'beginner', playerColor: 'white' });
        gameId = createResponse.body.data.id;
      }

      const response = await request(app)
        .post(`/api/ai/game/${gameId}/move`)
        .send({ move: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
