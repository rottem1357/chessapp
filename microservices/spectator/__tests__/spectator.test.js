const request = require('supertest');

// Use an in-memory Redis mock for tests
process.env.MOCK_REDIS = 'true';

const redis = require('../redis');
const app = require('../server');

beforeAll(async () => {
  // Seed a game state and moves
  await redis.set('game:1:state', JSON.stringify({ board: 'state', turn: 'white' }));
  await redis.rpush('game:1:moves', JSON.stringify({ move: 'e4' }));
  await redis.rpush('game:1:moves', JSON.stringify({ move: 'e5' }));
});

afterAll(() => redis.disconnect());

describe('Spectator service API', () => {
  test('fetches game state and increments spectator count', async () => {
    const res = await request(app).get('/games/1/state');
    expect(res.status).toBe(200);
    expect(res.body.state).toEqual({ board: 'state', turn: 'white' });
    const count = await redis.get('game:1:spectators');
    expect(parseInt(count, 10)).toBe(1);
  });

  test('fetches moves since given index', async () => {
    const res = await request(app).get('/games/1/moves?since=1');
    expect(res.status).toBe(200);
    expect(res.body.moves).toEqual([{ move: 'e5' }]);
    expect(res.body.next).toBe(2);
    expect(res.body.total).toBe(2);
  });
});
