const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../models');

/**
 * Create a test user
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: await bcrypt.hash('Password123!', 10),
    display_name: 'Test User',
    country: 'US',
    is_verified: true,
    is_active: true
  };

  const user = await db.User.create({
    ...defaultData,
    ...userData
  });

  return user;
}

/**
 * Create multiple test users
 */
async function createTestUsers(count = 2) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      username: `testuser${i + 1}`,
      email: `test${i + 1}@example.com`,
      display_name: `Test User ${i + 1}`
    });
    users.push(user);
  }
  return users;
}

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Create authenticated request
 */
function authenticatedRequest(app, user) {
  const token = generateToken(user.id);
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`)
  };
}

/**
 * Create a test game
 */
async function createTestGame(gameData = {}) {
  const defaultData = {
    game_type: 'rapid',
    time_control: '10+0',
    time_limit_seconds: 600,
    increment_seconds: 0,
    status: 'waiting',
    is_rated: true,
    is_private: false
  };

  const game = await db.Game.create({
    ...defaultData,
    ...gameData
  });

  return game;
}

/**
 * Create a player for a game
 */
async function createTestPlayer(gameId, userId, color = 'white') {
  const player = await db.Player.create({
    game_id: gameId,
    user_id: userId,
    color: color,
    rating_before: 1200
  });

  return player;
}

/**
 * Create a complete test game with players
 */
async function createGameWithPlayers(users = null) {
  if (!users) {
    users = await createTestUsers(2);
  }

  const game = await createTestGame();
  
  const whitePlayer = await createTestPlayer(game.id, users[0].id, 'white');
  const blackPlayer = await createTestPlayer(game.id, users[1].id, 'black');

  return {
    game,
    users,
    whitePlayer,
    blackPlayer
  };
}

/**
 * Create a test puzzle
 */
async function createTestPuzzle(puzzleData = {}) {
  const defaultData = {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4',
    moves: 'e1g1,e8g8', // Simple castling puzzle
    rating: 1200,
    themes: ['castling', 'safety']
  };

  const puzzle = await db.Puzzle.create({
    ...defaultData,
    ...puzzleData
  });

  return puzzle;
}

/**
 * Create test friendship
 */
async function createTestFriendship(requesterId, addresseeId, status = 'pending') {
  const friendship = await db.Friendship.create({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: status
  });

  return friendship;
}

/**
 * Assert response structure - updated for unified format
 */
function expectValidResponse(response, expectedData = null) {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  expect(response.body).toBeDefined();

  // Validate unified response structure
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('timestamp');
  
  // Validate timestamp format
  expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  
  if (expectedData) {
    expect(response.body.data).toMatchObject(expectedData);
  }
}

/**
 * Assert error response structure - updated for unified format
 */
function expectErrorResponse(response, expectedCode = null) {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.body).toBeDefined();

  // Validate unified error response structure
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('errorCode');
  expect(response.body).toHaveProperty('timestamp');
  
  // Validate timestamp format
  expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  
  // For validation errors, data should contain error details
  // For other errors, data should be null
  if (response.body.errorCode === 'VALIDATION_001') {
    expect(response.body.data).toHaveProperty('errors');
    expect(Array.isArray(response.body.data.errors)).toBe(true);
  } else {
    expect(response.body.data).toBe(null);
  }
  
  if (expectedCode) {
    expect(response.body.errorCode).toBe(expectedCode);
  }
}

/**
 * Assert pagination structure - updated for unified format
 */
function expectPaginatedResponse(response) {
  expectValidResponse(response);
  expect(response.body.data).toHaveProperty('pagination');
  expect(response.body.data.pagination).toHaveProperty('page');
  expect(response.body.data.pagination).toHaveProperty('limit');
  expect(response.body.data.pagination).toHaveProperty('total');
  expect(response.body.data.pagination).toHaveProperty('pages');
  expect(response.body.data.pagination).toHaveProperty('hasNext');
  expect(response.body.data.pagination).toHaveProperty('hasPrev');
}

/**
 * Validate UUID format
 */
function expectValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(uuid).toMatch(uuidRegex);
}

/**
 * Validate authentication token format
 */
function expectValidToken(token) {
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(50);
  // JWT tokens have 3 parts separated by dots
  expect(token.split('.')).toHaveLength(3);
}

module.exports = {
  createTestUser,
  createTestUsers,
  generateToken,
  authenticatedRequest,
  createTestGame,
  createTestPlayer,
  createGameWithPlayers,
  createTestPuzzle,
  createTestFriendship,
  expectValidResponse,
  expectErrorResponse,
  expectPaginatedResponse,
  expectValidUUID,
  expectValidToken
};