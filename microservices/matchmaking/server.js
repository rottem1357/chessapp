// microservices/matchmaking/server.js
const express = require('express');
const Redis = require('ioredis');
const EventEmitter = require('events');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const events = new EventEmitter();

const app = express();
app.use(express.json());

const QUEUE_PREFIX = 'mm:';

async function findMatch(key, rating, playerId, selfMember) {
  const now = Date.now();
  const entries = await redis.zrange(key, 0, -1, 'WITHSCORES');
  for (let i = 0; i < entries.length; i += 2) {
    const member = entries[i];
    const score = parseFloat(entries[i + 1]);
    let data;
    try {
      data = JSON.parse(member);
    } catch (_) {
      continue;
    }
    if (data.playerId === playerId) continue;
    const waitSeconds = (now - data.ts) / 1000;
    const window = 50 + waitSeconds * 50; // expands 50 rating per second
    if (Math.abs(rating - score) <= window) {
      // remove opponent and self from queue
      await redis.zrem(key, member);
      await redis.zrem(key, selfMember);
      return { playerId: data.playerId, region: data.region };
    }
  }
  return null;
}

app.post('/queue/join', async (req, res) => {
  const { playerId, mode, rating, region } = req.body;
  if (!playerId || !mode || typeof rating !== 'number') {
    return res.status(400).json({ error: 'playerId, mode and rating required' });
  }
  const ts = Date.now();
  const key = `${QUEUE_PREFIX}${mode}`;
  const member = JSON.stringify({ playerId, ts, region });
  await redis.zadd(key, rating, member);
  const match = await findMatch(key, rating, playerId, member);
  if (match) {
    events.emit('match.found', { p1: playerId, p2: match.playerId, mode, region: match.region || region });
    return res.json({ matched: true, opponent: match.playerId });
  }
  return res.json({ matched: false });
});

app.post('/queue/leave', async (req, res) => {
  const { playerId, mode } = req.body;
  if (!playerId || !mode) {
    return res.status(400).json({ error: 'playerId and mode required' });
  }
  const key = `${QUEUE_PREFIX}${mode}`;
  const members = await redis.zrange(key, 0, -1);
  for (const member of members) {
    try {
      const data = JSON.parse(member);
      if (data.playerId === playerId) {
        await redis.zrem(key, member);
        return res.json({ removed: true });
      }
    } catch (_) {}
  }
  return res.json({ removed: false });
});

app.get('/queue/state', async (req, res) => {
  const { mode } = req.query;
  if (!mode) {
    return res.status(400).json({ error: 'mode required' });
  }
  const key = `${QUEUE_PREFIX}${mode}`;
  const members = await redis.zrange(key, 0, -1, 'WITHSCORES');
  const out = [];
  for (let i = 0; i < members.length; i += 2) {
    try {
      const data = JSON.parse(members[i]);
      out.push({ playerId: data.playerId, rating: parseFloat(members[i + 1]), ts: data.ts, region: data.region });
    } catch (_) {}
  }
  res.json(out);
});

// simple event logging
events.on('match.found', (payload) => {
  console.log('match.found', payload);
});

const PORT = process.env.PORT || 8086;
app.listen(PORT, () => {
  console.log(`Matchmaking service listening on ${PORT}`);
});

module.exports = { app, events };
