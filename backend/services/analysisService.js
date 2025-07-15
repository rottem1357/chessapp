const { Analysis, Game } = require('../models'); // adjust depending on where your models are
const { NotFoundError, BadRequestError } = require('../utils/errors');
const stockfish = require('../utils/stockfish'); // optional: custom wrapper if you use Stockfish

/**
 * Analyze a chess game and store the result.
 * @param {Object} data - The input data, e.g., { gameId }
 * @returns {Object} - Analysis result
 */
async function analyzeGame(data) {
  const { gameId } = data;

  if (!gameId) {
    throw new BadRequestError('Missing game ID for analysis.');
  }

  // Fetch the PGN or move history from the game model
  const game = await Game.findById(gameId);
  if (!game) {
    throw new NotFoundError('Game not found.');
  }

  // Run analysis (replace with your real engine call)
  const analysisResult = await stockfish.analyze(game.pgn || game.moves);

  // Save analysis to database
  const saved = await Analysis.create({
    game: gameId,
    result: analysisResult,
    createdAt: new Date(),
  });

  return saved;
}

/**
 * Get analysis result by ID.
 * @param {string} id - Analysis ID
 * @param {Object} user - Optional: for access control
 * @returns {Object} - Analysis record
 */
async function getAnalysisById(id, user) {
  const analysis = await Analysis.findById(id).populate('game');

  if (!analysis) {
    throw new NotFoundError('Analysis not found.');
  }

  // Optional: check if user is allowed to view
  // if (String(analysis.user) !== String(user._id)) {
  //   throw new ForbiddenError('Access denied.');
  // }

  return analysis;
}

/**
 * Delete an analysis by ID.
 * @param {string} id - Analysis ID
 * @param {Object} user - Optional: for access control
 * @returns {Object} - Deletion result
 */
async function deleteAnalysis(id, user) {
  const analysis = await Analysis.findById(id);

  if (!analysis) {
    throw new NotFoundError('Analysis not found.');
  }

  // Optional: check permissions
  // if (String(analysis.user) !== String(user._id)) {
  //   throw new ForbiddenError('Access denied.');
  // }

  await Analysis.findByIdAndDelete(id);

  return { message: 'Analysis deleted successfully.' };
}

module.exports = {
  analyzeGame,
  getAnalysisById,
  deleteAnalysis,
};
