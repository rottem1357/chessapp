// scripts/ensure-redis.js
// Ensures a local Redis is up before starting dev servers.
// - If REDIS_URL is local and closed, runs: docker compose -f backend/docker-compose.redis.yml up -d
// - Waits for the port to open (up to ~20s)

// Node stdlib only (no deps)
const fs = require('fs');
const net = require('net');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = process.cwd();
const BACKEND_ENV = path.join(ROOT, 'backend', '.env');
const DEFAULT_URL = 'redis://localhost:6379';

function parseRedisUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname || 'localhost';
    const port = Number(u.port || 6379);
    return { host, port };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

function readBackendEnv() {
  if (!fs.existsSync(BACKEND_ENV)) return {};
  const text = fs.readFileSync(BACKEND_ENV, 'utf8');
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    // strip quotes if present
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function canConnect(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const onDone = (ok) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(port, host);
  });
}

async function waitFor(host, port, totalMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < totalMs) {
    /* eslint-disable no-await-in-loop */
    const ok = await canConnect(host, port, 700);
    if (ok) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  const env = readBackendEnv();
  const redisUrl = env.REDIS_URL || DEFAULT_URL;
  const { host, port } = parseRedisUrl(redisUrl);

  // Only try to launch Docker if host looks local
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);

  const reachable = await canConnect(host, port);
  if (reachable) {
    console.log(`[ensure-redis] Redis already reachable at ${host}:${port}`);
    return;
  }

  if (!isLocal) {
    console.warn(`[ensure-redis] Redis not reachable at ${host}:${port}, and host is not local. Skipping Docker startup.`);
    return;
  }

  console.log(`[ensure-redis] Redis not running locally at ${host}:${port}. Starting Docker Compose...`);

  // Try docker compose (new) then docker-compose (legacy)
  try {
    execSync('docker compose -f backend/docker-compose.redis.yml up -d', {
      stdio: 'inherit',
      cwd: ROOT,
    });
  } catch (e1) {
    try {
      execSync('docker-compose -f backend/docker-compose.redis.yml up -d', {
        stdio: 'inherit',
        cwd: ROOT,
      });
    } catch (e2) {
      console.error('[ensure-redis] Failed to start Redis via Docker Compose.');
      // Do not hard-fail; allow dev to continue (backend may fall back to memory if coded so)
      return;
    }
  }

  const ok = await waitFor(host, port, 20000);
  if (ok) {
    console.log(`[ensure-redis] Redis is up at ${host}:${port}`);
  } else {
    console.warn('[ensure-redis] Timed out waiting for Redis. The backend may fall back to in-memory queues if configured.');
  }
}

main().catch((err) => {
  console.error('[ensure-redis] Unexpected error:', err && err.message ? err.message : err);
});
