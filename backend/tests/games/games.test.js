const request = require('supertest');
const { app } = require('../../server');
const {
  createTestUser,
  authenticatedRequest,
  expectValidResponse,
  expectErrorResponse
} = require('../helpers/testHelpers');

describe('Game Routes', () => {
  describe('GET /api/games', () => {
    it('should return a list of games', async () => {
      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expectValidResponse(response);
      // API spec: response.body.data.games should be an array
      expect(Array.isArray(response.body.data.games)).toBe(true);
      // API spec: pagination object should exist
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('pages');
    });

    it('should support pagination and filtering', async () => {
      const response = await request(app)
        .get('/api/games?page=1&limit=2&game_type=rapid&status=active&is_rated=true')
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data.games)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 2);
      // If games exist, check their type and status
      if (response.body.data.games.length > 0) {
        response.body.data.games.forEach(game => {
          expect(game.game_type).toBe('rapid');
          expect(game.status).toBe('active');
          expect(game.is_rated).toBe(true);
        });
      }
    });

    it('should return 400 for invalid query params', async () => {
      const response = await request(app)
        .get('/api/games?page=notanumber')
        .expect(400);

      expectErrorResponse(response);
      expect(response.body).toHaveProperty('errorCode', 'VALIDATION_001');
    });

    it('should return empty games array if no games match filter', async () => {
      const response = await request(app)
        .get('/api/games?game_type=nonexistenttype')
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data.games)).toBe(true);
      expect(response.body.data.games.length).toBe(0);
    });
  });

  describe('GET /api/games/:gameId', () => {
    it('should return game details with expected structure', async () => {
      // Replace '1' with a valid gameId if available from setup
      const response = await request(app)
        .get('/api/games/1')
        .expect(200);

      expectValidResponse(response);
      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('board');
      expect(Array.isArray(data.players)).toBe(true);
      expect(['white', 'black']).toContain(data.current_turn);
      expect(typeof data.move_count).toBe('number');
      expect(typeof data.last_move).toBe('string');
      expect(typeof data.created_at).toBe('string');
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/games/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expectErrorResponse(response);
      expect(response.body).toHaveProperty('errorCode', 'GAME_NOT_FOUND');
    });

    it('should return 400 for invalid gameId format', async () => {
      const response = await request(app)
        .get('/api/games/not-a-uuid')
        .expect(400);

      expectErrorResponse(response);
      expect(response.body).toHaveProperty('errorCode', 'VALIDATION_001');
    });

    it('should include all required player fields', async () => {
      const response = await request(app)
        .get('/api/games/1')
        .expect(200);

      expectValidResponse(response);
      const players = response.body.data.players;
      if (players.length > 0) {
        players.forEach(player => {
          expect(player).toHaveProperty('id');
          expect(player).toHaveProperty('username');
          expect(['white', 'black']).toContain(player.color);
          expect(typeof player.time_remaining).toBe('number');
        });
      }
    });
  });

  describe('GET /api/games/:gameId/moves', () => {
    it('should return move history', async () => {
      const response = await request(app)
        .get('/api/games/1/moves')
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/games/:gameId/opening', () => {
    it('should return game opening', async () => {
      const response = await request(app)
        .get('/api/games/1/opening')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('opening');
    });
  });

  describe('POST /api/games', () => {
    it('should create a new game', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games')
        .send({ opponent: 'testOpponent' })
        .expect(201);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('POST /api/games/:gameId/join', () => {
    it('should join a game', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games/1/join')
        .send({ side: 'black' })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('POST /api/games/:gameId/moves', () => {
    it('should make a move', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games/1/moves')
        .send({ move: 'e2e4' })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('move');
    });
  });

  describe('POST /api/games/:gameId/resign', () => {
    it('should resign the game', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games/1/resign')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('POST /api/games/:gameId/draw', () => {
    it('should offer a draw', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games/1/draw')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('drawOffered');
    });
  });

  describe('PUT /api/games/:gameId/draw', () => {
    it('should respond to a draw offer', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .put('/api/games/1/draw')
        .send({ accept: true })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('drawAccepted');
    });
  });

  describe('GET /api/games/:gameId/analysis', () => {
    it('should get game analysis', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .get('/api/games/1/analysis')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('analysis');
    });
  });

  describe('POST /api/games/:gameId/analyze', () => {
    it('should request analysis', async () => {
      const user = await createTestUser();
      const response = await authenticatedRequest(user)
        .post('/api/games/1/analyze')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('analysisRequested');
    });
  });
});