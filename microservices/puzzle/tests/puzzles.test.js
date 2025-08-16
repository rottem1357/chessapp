const request = require('supertest');
const app = require('../server');

describe('Puzzle Service', () => {
  test('should not repeat puzzles consecutively for the same user', async () => {
    const res1 = await request(app).get('/puzzles/next').query({ userId: 'user1' });
    const res2 = await request(app).get('/puzzles/next').query({ userId: 'user1' });
    expect(res1.body.id).not.toBe(res2.body.id);
  });

  test('should respond within 100ms for next puzzle', async () => {
    const start = Date.now();
    await request(app).get('/puzzles/next').query({ userId: 'user2' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
