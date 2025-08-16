const request = require('supertest');
const app = require('./server');
const redis = require('./db/redis');

beforeEach(async () => {
  await redis.flushall();
  await redis.set('nodes:node1:capacity', 2);
  await redis.set('nodes:node2:capacity', 1);
});

afterAll(async () => {
  await redis.disconnect();
});

it('allocates new games to node with highest capacity', async () => {
  const res = await request(app).post('/games').send({ gameId: 'g1' });
  expect(res.status).toBe(201);
  expect(res.body.nodeId).toBe('node1');
  const route = await redis.get('route:game:g1');
  expect(route).toBe('node1');
  const cap = await redis.get('nodes:node1:capacity');
  expect(cap).toBe('1');
});

it('returns node id for existing game', async () => {
  await redis.set('route:game:g2', 'node2');
  const res = await request(app).get('/routing/g2');
  expect(res.status).toBe(200);
  expect(res.body.nodeId).toBe('node2');
});

it('skips nodes with zero capacity', async () => {
  await request(app).post('/games').send({ gameId: 'g1' });
  await request(app).post('/games').send({ gameId: 'g2' });
  const res = await request(app).post('/games').send({ gameId: 'g3' });
  expect(res.body.nodeId).toBe('node2');
});

it('returns 503 when no capacity available', async () => {
  await request(app).post('/games').send({ gameId: 'g1' });
  await request(app).post('/games').send({ gameId: 'g2' });
  await request(app).post('/games').send({ gameId: 'g3' });
  const res = await request(app).post('/games').send({ gameId: 'g4' });
  expect(res.status).toBe(503);
});

it('handles node churn when a node disappears', async () => {
  await redis.del('nodes:node1:capacity');
  const res = await request(app).post('/games').send({ gameId: 'g1' });
  expect(res.body.nodeId).toBe('node2');
});
