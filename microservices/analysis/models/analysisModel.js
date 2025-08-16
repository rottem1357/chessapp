// microservices/analysis/models/analysisModel.js
// In-memory data store; to be replaced with persistent storage.

const jobs = new Map();
const analyses = new Map();

exports.createJob = (gameId, jobId) => {
  jobs.set(jobId, { gameId, status: 'queued' });
  analyses.set(gameId, { status: 'pending', moves: [] });
};

exports.getAnalysis = (gameId) => analyses.get(gameId);
