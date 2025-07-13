/**
 * Auth Route Tests
 * Automated tests for authentication endpoints
 */

const request = require('supertest');
const { app } = require('../../server');

describe('Auth Routes', () => {

const { ERROR_MESSAGES } = require('../../utils/constants');
const User = require('../../models/User');
let testUser = { username: 'testuser5', email: 'testuser5@example.com', password: 'TestPass123' };
let token;

beforeAll(async () => {
  // Remove any existing user with the same username or email
  await User.destroy({ where: { username: testUser.username } });
  await User.destroy({ where: { email: testUser.email } });
});

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    console.log('REGISTER RESPONSE:', res.body);
    expect(res.statusCode).toBe(201);
    // Always expect id, not _id
    if (res.body.data) {
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.username).toBe(testUser.username);
      expect(res.body.data.email).toBe(testUser.email);
    } else {
      expect(res.body.id).toBeDefined();
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.email).toBe(testUser.email);
    }
  });

  it('should not register duplicate user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(ERROR_MESSAGES.USER_EXISTS);
  });

  it('should login with correct credentials (username)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });
    console.log('LOGIN RESPONSE (username):', res.body);
    expect(res.statusCode).toBe(200);
    if (res.body.data) {
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      token = res.body.data.token;
    } else {
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      token = res.body.token;
    }
  });

  it('should login with correct credentials (email)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    console.log('LOGIN RESPONSE (email):', res.body);
    expect(res.statusCode).toBe(200);
    if (res.body.data) {
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    } else {
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    }
  });

  it('should get user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe(testUser.username);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should logout with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res.statusCode).toBe(200);
  });

  it('should not get profile with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(403);
    // Optionally check error message if returned
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'baduser' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(ERROR_MESSAGES.MISSING_FIELDS);
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'WrongPass' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe(ERROR_MESSAGES.INVALID_PASSWORD);
  });

  it('should request password reset', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });
    expect(res.statusCode).toBe(200);
  });

  it('should not request password reset with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'notfound@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(ERROR_MESSAGES.EMAIL_NOT_FOUND);
  });

  it('should confirm password reset with valid data (stub)', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ reset_token: 'sometoken', new_password: 'NewPass123' });
    expect(res.statusCode).toBe(200);
  });
});
