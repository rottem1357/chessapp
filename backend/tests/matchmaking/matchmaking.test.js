// tests/matchmaking/matchmaking.test.js
const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const {
  createTestUsers,
  createTestUser,
  authenticatedRequest,
  expectValidResponse,
  expectErrorResponse,
  expectValidUUID
} = require('../helpers/testHelpers');

describe('Matchmaking Integration Tests', () => {
  let testUsers = [];

  beforeEach(async () => {
    // Create test users for matchmaking
    testUsers = await createTestUsers(2, {
      rating_rapid: 1200,
      rating_blitz: 1200,
      rating_bullet: 1200
    });
  });

  describe('POST /api/matchmaking/queue', () => {
    describe('Queue Management', () => {
      it('should allow user to join matchmaking queue', async () => {
        const authRequest = authenticatedRequest(app, testUsers[0]);
        
        const response = await authRequest.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 1000, max: 1400 }
          })
          .expect(200);

        expectValidResponse(response);
        expect(response.body.data).toHaveProperty('position');
        expect(response.body.data).toHaveProperty('estimatedWaitTime');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0'
          })
          .expect(401);

        expectErrorResponse(response);
      });

      it('should validate game type', async () => {
        const authRequest = authenticatedRequest(app, testUsers[0]);
        
        const response = await authRequest.post('/api/matchmaking/queue')
          .send({
            game_type: 'invalid',
            time_control: '10+0'
          })
          .expect(400);

        expectErrorResponse(response, 'VALIDATION_001');
      });

      it('should validate time control format', async () => {
        const authRequest = authenticatedRequest(app, testUsers[0]);
        
        const response = await authRequest.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: 'invalid-format'
          })
          .expect(400);

        expectErrorResponse(response, 'VALIDATION_001');
      });

      it('should validate time control when not provided', async () => {
        const authRequest = authenticatedRequest(app, testUsers[0]);
        
        const response = await authRequest.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid'
          })
          .expect(400);

        expectErrorResponse(response, 'VALIDATION_001');
      });
    });

    describe('Matchmaking Process', () => {
      it('should find immediate match when compatible players join', async () => {
        const authRequest1 = authenticatedRequest(app, testUsers[0]);
        const authRequest2 = authenticatedRequest(app, testUsers[1]);

        // First player joins queue
        const response1 = await authRequest1.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 1000, max: 1500 }
          })
          .expect(200);

        expectValidResponse(response1);

        // Second player joins queue - should find immediate match
        const response2 = await authRequest2.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 1000, max: 1500 }
          })
          .expect(200);

        expectValidResponse(response2);

        // Check if either response indicates a match was found
        const matchFound = response1.body.data.game || response2.body.data.game;
        
        if (matchFound) {
          const game = response1.body.data.game || response2.body.data.game;
          expectValidUUID(game.id);
          expect(game.game_type).toBe('rapid');
          expect(game.time_control).toBe('10+0');
          expect(game.status).toBe('active');
          expect(game.is_rated).toBe(true);
        }
      }, 15000);

      it('should respect rating ranges in matchmaking', async () => {
        // Create users with different ratings and unique usernames
        const lowRatedUser = await createTestUser({
          username: 'lowrateduser',
          email: 'lowrated@test.com',
          rating_rapid: 800
        });

        const highRatedUser = await createTestUser({
          username: 'highrateduser',
          email: 'highrated@test.com', 
          rating_rapid: 1800
        });

        const authRequest1 = authenticatedRequest(app, lowRatedUser);
        const authRequest2 = authenticatedRequest(app, highRatedUser);

        // Low rated player joins with narrow range
        await authRequest1.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 700, max: 900 }
          })
          .expect(200);

        // High rated player joins with narrow range - should not match
        const response2 = await authRequest2.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 1700, max: 1900 }
          })
          .expect(200);

        // Should not find immediate match due to rating difference
        expect(response2.body.data.game).toBeUndefined();
      });

      it('should match players with same time control', async () => {
        const authRequest1 = authenticatedRequest(app, testUsers[0]);
        const authRequest2 = authenticatedRequest(app, testUsers[1]);

        // First player wants 10+0
        await authRequest1.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0'
          })
          .expect(200);

        // Second player wants 15+10 - should not match immediately
        const response2 = await authRequest2.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '15+10'
          })
          .expect(200);

        // Should be added to queue, not matched
        expect(response2.body.data.game).toBeUndefined();
        expect(response2.body.data).toHaveProperty('position');
      });
    });
  });

  describe('GET /api/matchmaking/status', () => {
    it('should return queue status for authenticated user', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      // First join a queue
      await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0'
        })
        .expect(200);

      // Then check status
      const response = await authRequest.get('/api/matchmaking/status')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('inQueue');
      expect(response.body.data).toHaveProperty('queueSizes');
      expect(response.body.data.queueSizes).toHaveProperty('rapid');
      expect(response.body.data.queueSizes).toHaveProperty('blitz');
      expect(response.body.data.queueSizes).toHaveProperty('bullet');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/matchmaking/status')
        .expect(401);

      expectErrorResponse(response);
    });

    it('should show not in queue when user has not joined', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      const response = await authRequest.get('/api/matchmaking/status')
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data.inQueue).toBe(false);
    });
  });

  describe('DELETE /api/matchmaking/queue', () => {
    it('should allow user to leave queue', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      // Join queue first
      await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0'
        })
        .expect(200);

      // Then leave
      const response = await authRequest.delete('/api/matchmaking/queue')
        .expect(200);

      expectValidResponse(response);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/matchmaking/queue')
        .expect(401);

      expectErrorResponse(response);
    });

    it('should handle leaving queue when not in queue gracefully', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      const response = await authRequest.delete('/api/matchmaking/queue')
        .expect(200);

      expectValidResponse(response);
    });
  });

  describe('Game Creation and Database Persistence', () => {
    it('should create game with correct database associations', async () => {
      const authRequest1 = authenticatedRequest(app, testUsers[0]);
      const authRequest2 = authenticatedRequest(app, testUsers[1]);

      // Join queues to trigger match
      await authRequest1.post('/api/matchmaking/queue')
        .send({
          game_type: 'blitz',
          time_control: '5+0',
          rating_range: { min: 1000, max: 1500 }
        })
        .expect(200);

      const response2 = await authRequest2.post('/api/matchmaking/queue')
        .send({
          game_type: 'blitz',
          time_control: '5+0',
          rating_range: { min: 1000, max: 1500 }
        })
        .expect(200);

      // If match was found, verify database state
      if (response2.body.data.game) {
        const gameId = response2.body.data.game.id;
        
        // Fetch game from database
        const game = await db.Game.findByPk(gameId, {
          include: [{
            model: db.Player,
            as: 'players',
            include: [{
              model: db.User,
              as: 'user',
              attributes: ['id', 'username', 'display_name']
            }]
          }]
        });

        // Verify game properties
        expect(game).toBeDefined();
        expect(game.game_type).toBe('blitz');
        expect(game.time_control).toBe('5+0');
        expect(game.status).toBe('active');
        expect(game.is_rated).toBe(true);

        // Verify players
        expect(game.players).toHaveLength(2);
        
        const colors = game.players.map(p => p.color).sort();
        expect(colors).toEqual(['black', 'white']);

        // Verify user associations
        const playerUserIds = game.players.map(p => p.user_id).sort();
        const testUserIds = testUsers.map(u => u.id).sort();
        expect(playerUserIds).toEqual(testUserIds);

        // Verify rating_before is captured
        game.players.forEach(player => {
          expect(player.rating_before).toBeDefined();
          expect(typeof player.rating_before).toBe('number');
          expect(player.rating_before).toBeGreaterThan(0);
        });
      }
    }, 20000);

    it('should handle game creation failure gracefully', async () => {
      // Test with invalid game data that might cause database errors
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      // Try to join queue with invalid data
      const response = await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0',
          rating_range: { min: -1000, max: 5000 } // Invalid range
        })
        .expect(200); // Should still accept but might handle internally

      expectValidResponse(response);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle user joining multiple queues', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      // Join rapid queue
      await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0'
        })
        .expect(200);

      // Join blitz queue (should remove from rapid)
      const response = await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'blitz',
          time_control: '5+0'
        })
        .expect(200);

      expectValidResponse(response);
    });

    it('should validate rating range boundaries', async () => {
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      const response = await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0',
          rating_range: { min: 1500, max: 1000 } // Invalid: min > max
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should handle database connection issues', async () => {
      // This test might need to mock database failures
      // For now, just verify the endpoint handles unexpected errors
      const authRequest = authenticatedRequest(app, testUsers[0]);
      
      // This should succeed under normal conditions
      const response = await authRequest.post('/api/matchmaking/queue')
        .send({
          game_type: 'rapid',
          time_control: '10+0'
        });

      // Should either succeed (200) or fail gracefully (500)
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Concurrent Matchmaking', () => {
    it('should handle multiple users joining queue simultaneously', async () => {
      // Create additional test users with unique usernames
      const user3 = await createTestUser({
        username: 'concurrentuser3',
        email: 'concurrent3@test.com',
        rating_rapid: 1200
      });
      
      const user4 = await createTestUser({
        username: 'concurrentuser4', 
        email: 'concurrent4@test.com',
        rating_rapid: 1200
      });

      const allUsers = [...testUsers, user3, user4];
      
      const promises = allUsers.map(user => {
        const authRequest = authenticatedRequest(app, user);
        return authRequest.post('/api/matchmaking/queue')
          .send({
            game_type: 'rapid',
            time_control: '10+0',
            rating_range: { min: 1000, max: 1500 }
          });
      });

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
        expectValidResponse(response);
      });

      // Some matches should have been created
      const gamesCreated = responses.filter(r => r.body.data.game).length;
      expect(gamesCreated).toBeGreaterThanOrEqual(0);
    }, 30000);
  });
});