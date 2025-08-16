// microservices/game-persistence/database/postgres.js
const summaries = new Map();

async function saveGameSummary(gameId, summary) {
  summaries.set(gameId, summary);
}

async function getGameSummary(gameId) {
  return summaries.get(gameId);
}

function __reset() {
  summaries.clear();
}

module.exports = { saveGameSummary, getGameSummary, __reset };
