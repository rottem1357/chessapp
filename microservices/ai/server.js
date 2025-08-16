const express = require('express');
const Queue = require('bull');
const os = require('os');

const IORedis = require('ioredis');

// Stockfish wasm requires fetch to be undefined in Node to load from filesystem
delete globalThis.fetch;
const Stockfish = require('stockfish.wasm');

async function runEngine({ fen, level, timeLeft }) {
  const sf = await Stockfish();
  return new Promise((resolve) => {
    const start = Date.now();
    sf.addMessageListener((line) => {
      if (line.startsWith('bestmove')) {
        const uci = line.split(' ')[1];
        const thinkMs = Date.now() - start;
        sf.terminate();
        resolve({ uci, thinkMs });
      }
    });
    sf.postMessage('uci');
    sf.postMessage(`setoption name Skill Level value ${level}`);
    sf.postMessage(`position fen ${fen}`);
    sf.postMessage(`go movetime ${timeLeft}`);
  });
}

const moveQueue = new Queue('ai-move', {
  createClient: function () {
    const options = { maxRetriesPerRequest: null, enableReadyCheck: false };
    if (process.env.REDIS_URL) {
      return new IORedis(process.env.REDIS_URL, options);
    }
    return new IORedis(options);
  }
});

moveQueue.process(os.cpus().length, async (job) => {
  return runEngine(job.data);
});

const app = express();
app.use(express.json());

app.post('/ai/move', async (req, res) => {
  const { fen, level, timeLeft } = req.body;
  if (!fen || level === undefined || timeLeft === undefined) {
    return res.status(400).json({ error: 'fen, level, timeLeft required' });
  }
  try {
    const job = await moveQueue.add({ fen, level, timeLeft });
    const result = await job.finished();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Engine error' });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`AI Move Service listening on port ${port}`));
}

module.exports = { app, moveQueue };
