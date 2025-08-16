// microservices/game-persistence/kafka/partition.js
const crypto = require('crypto');

function getPartition(gameId, partitionCount) {
  const hash = crypto.createHash('sha1').update(gameId).digest('hex');
  return parseInt(hash.substring(0, 8), 16) % partitionCount;
}

module.exports = { getPartition };
