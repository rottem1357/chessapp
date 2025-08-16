const flagged = new Map();
const reports = new Map();

function flagUser(userId, confidence) {
  flagged.set(userId, { confidence });
}

function getFlagged() {
  return Array.from(flagged.entries()).map(([userId, data]) => ({
    userId,
    confidence: data.confidence
  }));
}

function incrementReport(userId) {
  const count = (reports.get(userId) || 0) + 1;
  reports.set(userId, count);
  return count;
}

module.exports = {
  flagUser,
  getFlagged,
  incrementReport
};
