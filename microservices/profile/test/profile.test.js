const request = require('supertest');
const app = require('../server');
const db = require('../db');
const redis = require('../utils/redis');

afterAll(() => {
  redis.disconnect();
});

beforeEach(() => {
  for (const key of Object.keys(db.profiles)) {
    delete db.profiles[key];
  }
  db.friends.length = 0;
});

describe('Profile Service', () => {
  test('creates and retrieves a profile', async () => {
    const putRes = await request(app)
      .put('/profiles/1')
      .set('x-user-id', '1')
      .send({ username: 'alice' });
    expect(putRes.status).toBe(200);

    const getRes = await request(app)
      .get('/profiles/1')
      .set('x-user-id', '1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.username).toBe('alice');
  });

  test('returns stats for profile', async () => {
    await request(app)
      .put('/profiles/1')
      .set('x-user-id', '1')
      .send({ username: 'alice', stats: { wins: 5, losses: 3 } });

    const res = await request(app)
      .get('/profiles/1/stats')
      .set('x-user-id', '1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ wins: 5, losses: 3 });
  });

  test('creates friend request', async () => {
    const res = await request(app)
      .post('/friends/2')
      .set('x-user-id', '1');
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('requires auth header', async () => {
    const res = await request(app)
      .get('/profiles/1');
    expect(res.status).toBe(401);
  });
});
