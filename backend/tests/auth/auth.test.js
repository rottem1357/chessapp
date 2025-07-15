const request = require('supertest');
const app = require('../../server'); // Your main app file
const db = require('../../models');
const {
const { server } = require('../../server'); // Your main app file
  expectValidResponse,
const { server } = require('../../server');
  expectErrorResponse
} = require('../helpers/testHelpers');

describe('Authentication Endpoints', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
const { server } = require('../../server'); // Your main app file
const db = require('../../models');
const {
const { server } = require('../../server');
const db = require('../../models');
const {
  createTestUser,
  expectValidResponse,
  expectErrorResponse
} = require('../helpers/testHelpers');
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should fail with duplicate username', async () => {
      await createTestUser({ username: 'existinguser' });

      const userData = {
        username: 'existinguser',
        email: 'different@example.com',
        password: 'Password123!'
      const response = await request(server)
      const response = await request(server)
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expectErrorResponse(response, 'REGISTRATION_FAILED');
    });

    it('should fail with invalid email', async () => {
      const userData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'Password123!'
      const response = await request(server)

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });

    it('should fail with weak password', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
      const response = await request(server)
      const response = await request(server)

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        username: 'loginuser',
        email: 'login@example.com'
      });
      const response = await request(server)
      const response = await request(server)
    it('should login with username successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'Password123!'
        })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('username', 'loginuser');
      const response = await request(server)
      const response = await request(server)
    it('should login with email successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('token');
      const response = await request(server)
      const response = await request(server)
    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expectErrorResponse(response, 'LOGIN_FAILED');
      const response = await request(server)
      const response = await request(server)
    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Password123!'
        })
        .expect(401);

      expectErrorResponse(response, 'LOGIN_FAILED');
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateToken(user.id);
      const response = await request(server)
      const response = await request(server)
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectValidResponse(response);
      expect(response.body.data).toHaveProperty('id', user.id);
      expect(response.body.data).toHaveProperty('username', user.username);
      expect(response.body.data).not.toHaveProperty('password_hash');
      const response = await request(server)
      const response = await request(server)
    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expectErrorResponse(response);
      const response = await request(server)
      const response = await request(server)
    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateToken(user.id);
      const response = await request(server)
      const response = await request(server)
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectValidResponse(response);
      const response = await request(server)
      const response = await request(server)
    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expectErrorResponse(response);
    });
  });

  describe('POST /api/auth/password-reset/request', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'reset@example.com'
      });
      const response = await request(server)
      const response = await request(server)
    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({
          email: 'reset@example.com'
        })
        .expect(200);

      expectValidResponse(response);
      const response = await request(server)
      const response = await request(server)
    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expectValidResponse(response);
      const response = await request(server)
      const response = await request(server)
    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });
});
