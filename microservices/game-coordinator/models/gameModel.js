const redis = require('../db/redis');

async function selectNode() {
  const keys = await redis.keys('nodes:*:capacity');
  let bestNode = null;
  let bestCap = -Infinity;
  for (const key of keys) {
    const cap = parseInt(await redis.get(key), 10);
    const nodeId = key.split(':')[1];
    if (cap > bestCap) {
      bestCap = cap;
      bestNode = nodeId;
    }
  }
  return bestCap > 0 ? bestNode : null;
}

async function assignGame(gameId, nodeId) {
  await redis.multi()
    .set(`route:game:${gameId}`, nodeId)
    .decr(`nodes:${nodeId}:capacity`)
    .exec();
}

function getRoute(gameId) {
  return redis.get(`route:game:${gameId}`);
}

module.exports = { selectNode, assignGame, getRoute };
