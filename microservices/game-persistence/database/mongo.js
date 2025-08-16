// microservices/game-persistence/database/mongo.js
const docs = new Map();

async function saveGameDoc(gameId, doc) {
  docs.set(gameId, doc);
}

async function getGameDoc(gameId) {
  return docs.get(gameId);
}

function __reset() {
  docs.clear();
}

module.exports = { saveGameDoc, getGameDoc, __reset };
