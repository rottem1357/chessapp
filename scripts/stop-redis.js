// scripts/stop-redis.js
// Stops the local Redis container started for dev

const { execSync } = require('child_process');
const path = require('path');

try {
  execSync('docker compose -f backend/docker-compose.redis.yml down', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'), // repo root
  });
  console.log('[stop-redis] Redis container stopped.');
} catch (e) {
  console.warn('[stop-redis] Failed to stop Redis container:', e.message);
}
