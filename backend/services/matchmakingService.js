// services/matchmakingService.js
let svc;
try {
  if (process.env.REDIS_URL) {
    const RedisMM = require('./matchmakingService.redis');
    svc = new RedisMM();
    console.log(`Matchmaking service: Redis`);
  } else {
    const MemoryMM = require('./matchmakingService.memory');
    svc = MemoryMM; // memory version should export an instance
    console.log(`Matchmaking service: Memory`);
  }
} catch (e) {
  // Fallback to memory if Redis impl is missing or errored
  try {
    const MemoryMM = require('./matchmakingService.memory');
    svc = MemoryMM;
  } catch (err) {
    // Bubble the original error to fail fast if neither works
    throw e;
  }
}
module.exports = svc;
