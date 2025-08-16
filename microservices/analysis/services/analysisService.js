// microservices/analysis/services/analysisService.js
// Service layer coordinating business logic for analysis jobs.

const { v4: uuidv4 } = require('uuid');
const analysisModel = require('../models/analysisModel');

exports.createJob = async (gameId) => {
  const jobId = uuidv4();
  analysisModel.createJob(gameId, jobId);
  return { jobId };
};

exports.getAnalysis = async (gameId) => {
  return analysisModel.getAnalysis(gameId);
};
