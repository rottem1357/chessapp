const request = require('supertest');
const app = require('../../app');
const {
  createTestUser,
  authenticatedRequest,
  expectValidResponse,
  expectErrorResponse
} = require('../helpers/testHelpers');

describe('AI Game Endpoints', () => {

  describe('GET /api/ai/difficulties', () => {
    it('should get AI difficulty levels', async () => {
      const response = await request(app)
        .get('/api/ai/difficulties')
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check structure of difficulty levels
      const difficulty = response.body.data[0];
      expect(difficulty).toHaveProperty('level');
      expect(difficulty).toHaveProperty('name');
      expect(difficulty).toHaveProperty('description');
      expect(difficulty).toHaveProperty('estimated_rating');
    });
  });

  describe('POST /api/ai/games', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should create AI game successfully', async () => {
      const gameData = {
        difficulty: 'intermediate',
        time_control: '10+0',
        user_color: 'white'
      };

      const response = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData)
        .expect(201);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('game_type', 'ai');
      expect(response.body.data).toHaveProperty('ai_difficulty', 'intermediate');
      expect(response.body.data).toHaveProperty('status', 'active');
    });

    it('should create AI game with random color', async () => {
      const gameData = {
        difficulty: 'easy',
        user_color: 'random'
      };

      const response = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData)
        .expect(201);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('ai_difficulty', 'easy');
    });

    it('should fail without authentication', async () => {
      const gameData = {
        difficulty: 'beginner'
      };

      const response = await request(app)
        .post('/api/ai/games')
        .send(gameData)
        .expect(401);

      expectErrorResponse(response);
    });

    it('should fail with invalid difficulty', async () => {
      const gameData = {
        difficulty: 'invalid_difficulty'
      };

      const response = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with invalid time control', async () => {
      const gameData = {
        difficulty: 'beginner',
        time_control: 'invalid'
      };

      const response = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/ai/games/:gameId', () => {
    let user, aiGame;

    beforeEach(async () => {
      user = await createTestUser();
      
      // Create AI game first
      const gameData = {
        difficulty: 'intermediate',
        user_color: 'white'
      };

      const createResponse = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData);
      
      aiGame = createResponse.body.data;
    });

    it('should get AI game state', async () => {
      const response = await authenticatedRequest(app, user)
        .get(`/api/ai/games/${aiGame.id}`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id', aiGame.id);
      expect(response.body.data).toHaveProperty('current_fen');
      expect(response.body.data).toHaveProperty('current_turn');
      expect(response.body.data).toHaveProperty('players');
    });

    it('should fail to access other user\'s AI game', async () => {
      const otherUser = await createTestUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const response = await authenticatedRequest(app, otherUser)
        .get(`/api/ai/games/${aiGame.id}`)
        .expect(403);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/ai/games/:gameId/moves', () => {
    let user, aiGame;

    beforeEach(async () => {
      user = await createTestUser();
      
      const gameData = {
        difficulty: 'beginner',
        user_color: 'white'
      };

      const createResponse = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData);
      
      aiGame = createResponse.body.data;
    });

    it('should make move in AI game', async () => {
      const moveData = {
        move: 'e4',
        time_spent_ms: 3000
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/ai/games/${aiGame.id}/moves`)
        .send(moveData)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('userMove');
      expect(response.body.data).toHaveProperty('aiMove');
      expect(response.body.data.userMove).toHaveProperty('san', 'e4');
    });

    it('should fail with invalid move', async () => {
      const moveData = {
        move: 'invalid_move',
        time_spent_ms: 1000
      };

      const response = await authenticatedRequest(app, user)
        .post(`/api/ai/games/${aiGame.id}/moves`)
        .send(moveData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('POST /api/ai/games/:gameId/hint', () => {
    let aiGame;

    beforeEach(async () => {
      const gameData = {
        difficulty: 'beginner',
        user_color: 'white'
      };
      const createResponse = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData);
      aiGame = createResponse.body.data;
    });

    it('should get a hint for the next move', async () => {
      const response = await authenticatedRequest(app, user)
        .post(`/api/ai/games/${aiGame.id}/hint`)
        .send({})
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('hint');
      expect(response.body.data.hint).toHaveProperty('move');
      expect(typeof response.body.data.hint.move).toBe('string');
    });

    it('should fail to get a hint for invalid game', async () => {
      const response = await authenticatedRequest(app, user)
        .post(`/api/ai/games/invalid_id/hint`)
        .send({})
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail to get a hint without authentication', async () => {
      const response = await request(app)
        .post(`/api/ai/games/${aiGame.id}/hint`)
        .send({})
        .expect(401);

      expectErrorResponse(response);
    });
  });
      
  describe('DELETE /api/ai/games/:gameId', () => {
    let aiGame;

    beforeEach(async () => {
      const gameData = {
        difficulty: 'beginner',
        user_color: 'white'
      };
      const createResponse = await authenticatedRequest(app, user)
        .post('/api/ai/games')
        .send(gameData);
      aiGame = createResponse.body.data;
    });

    it('should end an AI game', async () => {
      const response = await authenticatedRequest(app, user)
        .delete(`/api/ai/games/${aiGame.id}`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id', aiGame.id);
      expect(response.body.data).toHaveProperty('status', 'ended');
    });

    it('should fail to end a game with invalid id', async () => {
      const response = await authenticatedRequest(app, user)
        .delete(`/api/ai/games/invalid_id`)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail to end a game without authentication', async () => {
      const response = await request(app)
        .delete(`/api/ai/games/${aiGame.id}`)
        .expect(401);

      expectErrorResponse(response);
    });
  });

