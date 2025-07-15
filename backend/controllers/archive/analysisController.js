/**
 * Analysis Controller
 * Handles chess analysis endpoints
 */

const { analyzeGame, getAnalysisById, deleteAnalysis } = require('../services/analysisService');
const { HTTP_STATUS } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Analyze a chess game
 */
async function analyzeGame(req, res) {
  try {
    logger.info('Analyzing game', { body: req.body });
    const analysisResult = await analyzeGame(req.body);
    res.status(HTTP_STATUS.OK).json(formatSuccessResponse(analysisResult));
  } catch (err) {
    logger.error('Game analysis failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

/**
 * Get a specific analysis by ID
 */
async function getGameAnalysis(req, res) {
  try {
    logger.info('Fetching analysis by ID', { id: req.params.id });
    const analysis = await getAnalysisById(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json(formatSuccessResponse(analysis));
  } catch (err) {
    logger.error('Fetching analysis by ID failed', { error: err.message });
    res.status(HTTP_STATUS.NOT_FOUND).json(formatErrorResponse(err.message));
  }
}

/**
 * Delete an analysis by ID
 */
async function remove(req, res) {
  try {
    logger.info('Deleting analysis', { id: req.params.id });
    const result = await deleteAnalysis(req.params.id, req.user);
    res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result));
  } catch (err) {
    logger.error('Deleting analysis failed', { error: err.message });
    res.status(HTTP_STATUS.BAD_REQUEST).json(formatErrorResponse(err.message));
  }
}

module.exports = {
  analyzeGame,
  history,
  getGameAnalysis,
  remove
};