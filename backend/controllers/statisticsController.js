// controllers/statisticsController.js
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get global statistics
 */
async function getGlobalStats(req, res) {
  try {
    logger.info('Global statistics request');

    // TODO: Implement statistics gathering
    const stats = {
      totalGames: 0,
      totalUsers: 0,
      activeGames: 0,
      onlineUsers: 0,
      message: 'Statistics feature not yet implemented'
    };

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, stats, 'Global statistics retrieved')
    );
  } catch (error) {
    logger.error('Failed to get global statistics', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'STATISTICS_FAILED')
    );
  }
}

module.exports = {
  getGlobalStats
};
