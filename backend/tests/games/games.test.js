const request = require('supertest');
const { app } = require('../../server');
const {
  createTestUser,
  createTestUsers,
  authenticatedRequest,
  createTestGame,
  createTestPlayer,
  createGameWithPlayers,
  expectValidResponse,
  expectErrorResponse,
  expectPaginatedResponse,
  expectValidUUID
} = require('../helpers/testHelpers');

describe('Game Routes', () => {
  describe('GET /api/games', () => {
    beforeEach(async () => {
      // Create some test games for listing
      await createTestGame({ 
        game_type: 'rapid', 
        status: 'waiting',
        is_rated: true 
      });
      await createTestGame({ 
        game_type: 'blitz', 
        status: 'active',
        is_rated: false 
      });
      await createTestGame({ 
        game_type: 'bullet', 
        status: 'finished',
        is_rated: true 
      });
    });

    it('should return paginated list of games', async () => {
      const response = await request(app)
        .get('/api/games')
        .expect(200);

      expectPaginatedResponse(response);
      expect(Array.isArray(response.body.data.games)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/games?page=1&limit=5')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should filter by game type', async () => {
      await createTestGame({ game_type: 'blitz' });
      
      const response = await request(app)
        .get('/api/games?game_type=rapid')
        .expect(200);

      expectValidResponse(response);
      response.body.data.games.forEach(game => {
        expect(game.game_type).toBe('rapid');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/games?status=waiting')
        .expect(200);

      expectValidResponse(response);
      response.body.data.games.forEach(game => {
        expect(game.status).toBe('waiting');
      });
    });

    it('should filter by rating requirement', async () => {
      const response = await request(app)
        .get('/api/games?is_rated=true')
        .expect(200);

      expectValidResponse(response);
      response.body.data.games.forEach(game => {
        expect(game.is_rated).toBe(true);
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/games?page=invalid')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should return 400 for invalid game type', async () => {
      const response = await request(app)
        .get('/api/games?game_type=invalid')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/games?status=invalid')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/games/:gameId', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should return game details for existing game', async () => {
      const response = await request(app)
        .get(`/api/games/${gameWithPlayers.game.id}`)
        .expect(200);

      expectValidResponse(response);
      const game = response.body.data;
      
      expectValidUUID(game.id);
      expect(game.status).toBe('waiting');
      expect(game.game_type).toBe('rapid');
      expect(Array.isArray(game.players)).toBe(true);
      expect(game.players).toHaveLength(2);
      expect(['white', 'black']).toContain(game.current_turn);
      expect(typeof game.move_count).toBe('number');
      expect(typeof game.created_at).toBe('string');
    });

    it('should include player information', async () => {
      const response = await request(app)
        .get(`/api/games/${gameWithPlayers.game.id}`)
        .expect(200);

      expectValidResponse(response);
      const players = response.body.data.players;
      
      players.forEach(player => {
        expectValidUUID(player.user_id);
        expect(player.user).toHaveProperty('username');
        expect(['white', 'black']).toContain(player.color);
        expect(typeof player.rating_before).toBe('number');
      });
    });

    it('should work with optional auth middleware', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      const response = await authRequest.get(`/api/games/${gameWithPlayers.game.id}`)
        .expect(200);

      expectValidResponse(response);
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/games/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expectErrorResponse(response, 'GAME_NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/games/invalid-uuid')
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/games/:gameId/moves', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should return move history for existing game', async () => {
      const response = await request(app)
        .get(`/api/games/${gameWithPlayers.game.id}/moves`)
        .expect(200);

      expectValidResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/games/00000000-0000-0000-0000-000000000000/moves')
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('GET /api/games/:gameId/opening', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should return opening information', async () => {
      const response = await request(app)
        .get(`/api/games/${gameWithPlayers.game.id}/opening`)
        .expect(200);

      expectValidResponse(response);
      // Opening might be null for new games
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/games/00000000-0000-0000-0000-000000000000/opening')
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/games', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        username: 'gamecreator',
        display_name: 'Game Creator'
      });
    });

    it('should create a new game with valid data', async () => {
      const authRequest = authenticatedRequest(app, testUser);
      const gameData = {
        game_type: 'rapid',
        time_control: '10+0',
        is_rated: true,
        is_private: false,
        preferred_color: 'white'
      };

      const response = await authRequest.post('/api/games')
        .send(gameData)
        .expect(201);

      expectValidResponse(response);
      const game = response.body.data;
      expectValidUUID(game.id);
      expect(game.game_type).toBe('rapid');
      expect(game.is_rated).toBe(true);
      expect(game.status).toBe('waiting');
    });

    it('should create private game with password', async () => {
      const authRequest = authenticatedRequest(app, testUser);
      const gameData = {
        game_type: 'blitz',
        is_private: true,
        password: 'secret123'
      };

      const response = await authRequest.post('/api/games')
        .send(gameData)
        .expect(201);

      expectValidResponse(response);
      expect(response.body.data.is_private).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ game_type: 'rapid' })
        .expect(401);

      expectErrorResponse(response);
    });

    it('should validate game type', async () => {
      const authRequest = authenticatedRequest(app, testUser);
      
      const response = await authRequest.post('/api/games')
        .send({ game_type: 'invalid' })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should validate time control format', async () => {
      const authRequest = authenticatedRequest(app, testUser);
      
      const response = await authRequest.post('/api/games')
        .send({ 
          game_type: 'rapid',
          time_control: 'invalid-format'
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should require password for private games', async () => {
      const authRequest = authenticatedRequest(app, testUser);
      
      const response = await authRequest.post('/api/games')
        .send({ 
          game_type: 'rapid',
          is_private: true
          // Missing password
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('POST /api/games/:gameId/join', () => {
    let testUsers;
    let waitingGame;

    beforeEach(async () => {
      testUsers = await createTestUsers(2);
      // Create a game with only one player (waiting for opponent)
      waitingGame = await createTestGame({ status: 'waiting' });
      await createTestPlayer(waitingGame.id, testUsers[0].id, 'white');
    });

    it('should allow joining a waiting game', async () => {
      const authRequest = authenticatedRequest(app, testUsers[1]);
      
      const response = await authRequest.post(`/api/games/${waitingGame.id}/join`)
        .send({})
        .expect(200);

      expectValidResponse(response);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/games/${waitingGame.id}/join`)
        .send({})
        .expect(401);

      expectErrorResponse(response);
    });

    it('should return 404 for non-existent game', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      const response = await authRequest.post('/api/games/00000000-0000-0000-0000-000000000000/join')
        .send({})
        .expect(404);

      expectErrorResponse(response);
    });

    it('should validate password for private games', async () => {
      const authRequest = authenticatedRequest(app, testUsers[1]);
      const privateGame = await createTestGame({ 
        is_private: true,
        password: 'secret123'
      });

      const response = await authRequest.post(`/api/games/${privateGame.id}/join`)
        .send({ password: 'wrong-password' })
        .expect(400);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/games/:gameId/moves', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should validate move format', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post(`/api/games/${gameWithPlayers.game.id}/moves`)
        .send({ move: 'invalid-move' })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/games/${gameWithPlayers.game.id}/moves`)
        .send({ move: 'e2e4' })
        .expect(401);

      expectErrorResponse(response);
    });

    it('should validate time spent', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post(`/api/games/${gameWithPlayers.game.id}/moves`)
        .send({ 
          move: 'e2e4',
          time_spent_ms: 'invalid'
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should validate promotion piece', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post(`/api/games/${gameWithPlayers.game.id}/moves`)
        .send({ 
          move: 'e7e8',
          promotion: 'invalid'
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('POST /api/games/:gameId/resign', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/games/${gameWithPlayers.game.id}/resign`)
        .expect(401);

      expectErrorResponse(response);
    });

    it('should return 404 for non-existent game', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post('/api/games/00000000-0000-0000-0000-000000000000/resign')
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/games/:gameId/draw', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/games/${gameWithPlayers.game.id}/draw`)
        .expect(401);

      expectErrorResponse(response);
    });

    it('should return 404 for non-existent game', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post('/api/games/00000000-0000-0000-0000-000000000000/draw')
        .expect(404);

      expectErrorResponse(response);
    });
  });

  describe('PUT /api/games/:gameId/draw', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should validate draw action', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.put(`/api/games/${gameWithPlayers.game.id}/draw`)
        .send({ action: 'invalid' })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/games/${gameWithPlayers.game.id}/draw`)
        .send({ action: 'accept' })
        .expect(401);

      expectErrorResponse(response);
    });

    it('should validate action is required', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.put(`/api/games/${gameWithPlayers.game.id}/draw`)
        .send({})
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('GET /api/games/:gameId/analysis', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should return not implemented status', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.get(`/api/games/${gameWithPlayers.game.id}/analysis`)
        .expect(501);

      expectErrorResponse(response, 'NOT_IMPLEMENTED');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/games/${gameWithPlayers.game.id}/analysis`)
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/games/:gameId/analyze', () => {
    let gameWithPlayers;

    beforeEach(async () => {
      const users = await createTestUsers(2);
      gameWithPlayers = await createGameWithPlayers(users);
    });

    it('should return not implemented status', async () => {
      const authRequest = authenticatedRequest(app, gameWithPlayers.users[0]);
      
      const response = await authRequest.post(`/api/games/${gameWithPlayers.game.id}/analyze`)
        .send({})
        .expect(501);

      expectErrorResponse(response, 'NOT_IMPLEMENTED');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/games/${gameWithPlayers.game.id}/analyze`)
        .send({})
        .expect(401);

      expectErrorResponse(response);
    });
  });
});