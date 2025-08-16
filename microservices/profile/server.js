const express = require('express');
const Redis = require('ioredis');

let redis;
if (process.env.NODE_ENV === 'test') {
  // Use a no-op client in tests to avoid connection delays
  redis = {
    get: async () => null,
    set: async () => {},
    disconnect: () => {},
  };
} else {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
  });
  redis.on('error', (err) => {
    console.error('Redis error', err.message);
  });
}

const app = express();
app.use(express.json());

// In-memory data stores
const profiles = {};
const friends = [];
const blocks = [];

// Simple auth middleware
function requireAuth(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.userId = userId;
  next();
}

app.use(requireAuth);

// GET /profiles/:id
app.get('/profiles/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `profile:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    // Ignore cache errors
  }

  const profile = profiles[id];
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  try {
    await redis.set(cacheKey, JSON.stringify(profile));
  } catch (err) {
    // Ignore cache errors
  }

  res.json(profile);
});

// PUT /profiles/:id
app.put('/profiles/:id', async (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const existing = profiles[id] || { id, stats: { wins: 0, losses: 0 } };
  const updated = { ...existing, ...req.body, id };
  profiles[id] = updated;

  try {
    await redis.set(`profile:${id}`, JSON.stringify(updated));
  } catch (err) {
    // Ignore cache errors
  }

  res.json(updated);
});

// GET /profiles/:id/stats
app.get('/profiles/:id/stats', (req, res) => {
  const { id } = req.params;
  const profile = profiles[id];
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  res.json(profile.stats || { wins: 0, losses: 0 });
});

// POST /friends/:id
app.post('/friends/:id', (req, res) => {
  const userId = req.userId;
  const friendId = req.params.id;

  if (userId === friendId) {
    return res.status(400).json({ message: 'Cannot friend yourself' });
  }

  friends.push({ userId, friendId, status: 'pending' });
  res.status(201).json({ status: 'pending' });
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Profile service listening on ${port}`);
  });
}

module.exports = { app, profiles, friends, blocks, redis };
