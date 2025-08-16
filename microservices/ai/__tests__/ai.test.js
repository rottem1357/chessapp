const request = require('supertest');
const { app, moveQueue } = require('../server');

jest.setTimeout(20000);

afterAll(async () => {
  await moveQueue.close();
});

describe('AI Move Service', () => {
  const payload = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    level: 20,
    timeLeft: 100
  };

  it('returns deterministic move per level', async () => {
    const res1 = await request(app).post('/ai/move').send(payload);
    const res2 = await request(app).post('/ai/move').send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.uci).toBe(res2.body.uci);
  }, 15000);

  it('respects time caps', async () => {
    const res = await request(app).post('/ai/move').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.thinkMs).toBeLessThanOrEqual(payload.timeLeft + 500);
  }, 15000);
});
