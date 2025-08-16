const request = require('supertest');
const app = require('../server');
const clubService = require('../services/clubService');

describe('Clubs Service', () => {
  beforeEach(() => clubService._reset());

  test('creates a club and retrieves it', async () => {
    const createRes = await request(app)
      .post('/clubs')
      .send({ name: 'Test Club', ownerId: 'user1' });
    expect(createRes.status).toBe(201);
    const clubId = createRes.body.id;

    const getRes = await request(app).get(`/clubs/${clubId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Test Club');
    expect(getRes.body.members).toContain('user1');
  });

  test('prevents joining a club twice', async () => {
    const { body } = await request(app)
      .post('/clubs')
      .send({ name: 'Test Club', ownerId: 'user1' });

    const firstJoin = await request(app)
      .post(`/clubs/${body.id}/join`)
      .send({ userId: 'user2' });
    expect(firstJoin.status).toBe(201);

    const secondJoin = await request(app)
      .post(`/clubs/${body.id}/join`)
      .send({ userId: 'user2' });
    expect(secondJoin.status).toBe(400);
  });

  test('handles large club listings', async () => {
    const { body } = await request(app)
      .post('/clubs')
      .send({ name: 'Big Club', ownerId: 'owner' });

    // Add many members
    const clubId = body.id;
    const members = Array.from({ length: 1000 }, (_, i) => `user${i}`);
    for (const m of members) {
      await request(app).post(`/clubs/${clubId}/join`).send({ userId: m });
    }

    const res = await request(app).get(`/clubs/${clubId}`);
    expect(res.status).toBe(200);
    expect(res.body.members.length).toBe(1001); // owner + 1000 others
  });
});
