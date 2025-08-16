const request = require('supertest');
const app = require('../server');

describe('Fair-Play Service', () => {
  test('flags user based on engine match percentage', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ games: [{ userId: 'player1', engineMatch: 0.95 }] });

    expect(res.body.flagged).toEqual([
      { userId: 'player1', confidence: 0.95 }
    ]);
  });

  test('flags user after multiple reports', async () => {
    await request(app).post('/report').send({ userId: 'player2' });
    await request(app).post('/report').send({ userId: 'player2' });

    const flagged = await request(app).get('/flagged');
    const flaggedUsers = flagged.body.flagged;

    const player2 = flaggedUsers.find(u => u.userId === 'player2');
    expect(player2).toBeDefined();
    expect(player2.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
