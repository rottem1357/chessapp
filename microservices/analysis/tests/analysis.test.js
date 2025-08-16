const request = require('supertest');
const app = require('../server');

describe('Analysis Service API', () => {
  test('rejects job creation without gameId', async () => {
    const res = await request(app).post('/analysis/jobs').send({});
    expect(res.status).toBe(400);
  });

  test('creates analysis job', async () => {
    const res = await request(app)
      .post('/analysis/jobs')
      .send({ gameId: 'game1' });
    expect(res.status).toBe(202);
    expect(res.body.jobId).toBeDefined();
  });

  test('retrieves analysis for game', async () => {
    await request(app).post('/analysis/jobs').send({ gameId: 'game2' });
    const res = await request(app).get('/analysis/game2');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('pending');
  });

  test('handles burst of job requests', async () => {
    const jobs = Array.from({ length: 5 }, (_, i) =>
      request(app).post('/analysis/jobs').send({ gameId: `burst${i}` })
    );
    const responses = await Promise.all(jobs);
    responses.forEach(res => expect(res.status).toBe(202));
  });
});
