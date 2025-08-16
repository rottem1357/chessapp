const redis = require('../redis');

async function getState(id) {
  const state = await redis.get(`game:${id}:state`);
  return state ? JSON.parse(state) : null;
}

async function incrementSpectators(id) {
  await redis.incr(`game:${id}:spectators`);
}

async function getMovesSince(id, since) {
  const total = await redis.llen(`game:${id}:moves`);
  const moves = await redis.lrange(`game:${id}:moves`, since, -1);
  return {
    moves: moves.map(m => JSON.parse(m)),
    next: since + moves.length,
    total
  };
}

module.exports = {
  getState,
  incrementSpectators,
  getMovesSince
};
