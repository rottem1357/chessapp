const request = require('supertest');
const app = require('../server');

describe('Media Service', () => {
  it('generates a signed upload URL', async () => {
    const res = await request(app)
      .post('/files/sign')
      .send({ fileName: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('X-Amz-Signature');
    expect(res.body.url).toContain('X-Amz-Expires');
    expect(res.body.key).toBeDefined();
  });

  it('generates a signed download URL', async () => {
    const resSign = await request(app)
      .post('/files/sign')
      .send({ fileName: 'file.txt', contentType: 'text/plain' });
    const key = resSign.body.key;

    const res = await request(app).get(`/files/${key}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toContain(key);
    expect(res.body.url).toContain('X-Amz-Signature');
  });

  it('validates sign request', async () => {
    const res = await request(app)
      .post('/files/sign')
      .send({ contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown file', async () => {
    const res = await request(app).get('/files/unknown-key');
    expect(res.status).toBe(404);
  });
});
