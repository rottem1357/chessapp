const { flagUser, getFlagged, incrementReport } = require('../models/fairplayModel');

const FLAG_THRESHOLD = 0.9;

function analyzeGames(games = []) {
  games.forEach(({ userId, engineMatch = 0 }) => {
    if (userId && engineMatch >= FLAG_THRESHOLD) {
      flagUser(userId, Number(engineMatch.toFixed(2)));
    }
  });
  return getFlagged();
}

function reportUser(userId) {
  const count = incrementReport(userId);
  const confidence = 0.8 + count * 0.05;
  if (confidence >= FLAG_THRESHOLD) {
    const finalConfidence = Number(Math.min(confidence, 1).toFixed(2));
    flagUser(userId, finalConfidence);
    return { userId, confidence: finalConfidence };
  }
  return null;
}

module.exports = {
  analyzeGames,
  reportUser,
  getFlagged
};
