// controllers/openingController.js
const db = require('../models');
const { HTTP_STATUS } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Search chess openings
 */
async function searchOpenings(req, res) {
  try {
    const { 
      search, 
      eco, 
      page = 1, 
      limit = 20 
    } = req.query;

    logger.info('Opening search request', { 
      search, 
      eco, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    const whereClause = {};
    
    // Add search filters
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { variation: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (eco) {
      whereClause.eco_code = eco.toUpperCase();
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await db.Opening.findAndCountAll({
      where: whereClause,
      order: [
        ['popularity', 'DESC'],
        ['eco_code', 'ASC']
      ],
      limit: parseInt(limit),
      offset,
      attributes: [
        'id', 'eco_code', 'name', 'variation', 'moves', 
        'move_count', 'popularity', 'white_wins', 'black_wins', 'draws'
      ]
    });

    const result = {
      openings: rows.map(opening => ({
        ...opening.toJSON(),
        winRates: {
          white: opening.popularity > 0 ? ((opening.white_wins / opening.popularity) * 100).toFixed(1) : 0,
          black: opening.popularity > 0 ? ((opening.black_wins / opening.popularity) * 100).toFixed(1) : 0,
          draw: opening.popularity > 0 ? ((opening.draws / opening.popularity) * 100).toFixed(1) : 0
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1
      }
    };

    res.status(HTTP_STATUS.OK).json(
      formatResponse(
        true,
        result,
        'Openings retrieved successfully',
        null,
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    logger.error('Failed to search openings', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'OPENING_SEARCH_FAILED')
    );
  }
}

/**
 * Get opening details by ID
 */
async function getOpeningDetails(req, res) {
  try {
    const { openingId } = req.params;

    logger.info('Opening details request', { 
      openingId,
      requestingUserId: req.user?.id
    });

    const opening = await db.Opening.findByPk(openingId, {
      include: [{
        model: db.Game,
        as: 'games',
        limit: 10,
        order: [['finished_at', 'DESC']],
        attributes: ['id', 'result', 'finished_at', 'move_count'],
        include: [{
          model: db.Player,
          as: 'players',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'display_name', 'rating_rapid']
          }]
        }]
      }]
    });

    if (!opening) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatResponse(false, null, 'Opening not found', 'OPENING_NOT_FOUND')
      );
    }

    // Calculate statistics
    const totalGames = opening.popularity;
    const winRates = {
      white: totalGames > 0 ? ((opening.white_wins / totalGames) * 100).toFixed(1) : 0,
      black: totalGames > 0 ? ((opening.black_wins / totalGames) * 100).toFixed(1) : 0,
      draw: totalGames > 0 ? ((opening.draws / totalGames) * 100).toFixed(1) : 0
    };

    const result = {
      ...opening.toJSON(),
      winRates,
      recentGames: opening.games || []
    };

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Opening details retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get opening details', { 
      error: error.message, 
      openingId: req.params.openingId 
    });

    const statusCode = error.message.includes('invalid input') ? 
      HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(
      formatResponse(false, null, error.message, 'OPENING_DETAILS_FAILED')
    );
  }
}

/**
 * Get popular openings
 */
async function getPopularOpenings(req, res) {
  try {
    const { 
      limit = 20,
      game_type,
      min_games = 100 
    } = req.query;

    logger.info('Popular openings request', { 
      limit, 
      game_type,
      min_games,
      requestingUserId: req.user?.id
    });

    const whereClause = {
      popularity: { [Op.gte]: parseInt(min_games) }
    };

    const openings = await db.Opening.findAll({
      where: whereClause,
      order: [['popularity', 'DESC']],
      limit: parseInt(limit),
      attributes: [
        'id', 'eco_code', 'name', 'variation', 'moves',
        'popularity', 'white_wins', 'black_wins', 'draws'
      ]
    });

    const result = openings.map(opening => ({
      ...opening.toJSON(),
      winRates: {
        white: ((opening.white_wins / opening.popularity) * 100).toFixed(1),
        black: ((opening.black_wins / opening.popularity) * 100).toFixed(1),
        draw: ((opening.draws / opening.popularity) * 100).toFixed(1)
      }
    }));

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, result, 'Popular openings retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get popular openings', { 
      error: error.message, 
      query: req.query 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'POPULAR_OPENINGS_FAILED')
    );
  }
}

/**
 * Get openings by ECO classification
 */
async function getOpeningsByECO(req, res) {
  try {
    const { eco_group } = req.params; // A, B, C, D, or E
    const { page = 1, limit = 50 } = req.query;

    logger.info('Openings by ECO request', { 
      eco_group, 
      page, 
      limit,
      requestingUserId: req.user?.id
    });

    // Validate ECO group
    if (!/^[A-E]$/.test(eco_group.toUpperCase())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatResponse(false, null, 'Invalid ECO group. Must be A, B, C, D, or E', 'INVALID_ECO_GROUP')
      );
    }

    const whereClause = {
      eco_code: { [Op.like]: `${eco_group.toUpperCase()}%` }
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await db.Opening.findAndCountAll({
      where: whereClause,
      order: [['eco_code', 'ASC']],
      limit: parseInt(limit),
      offset,
      attributes: [
        'id', 'eco_code', 'name', 'variation', 'moves',
        'popularity', 'white_wins', 'black_wins', 'draws'
      ]
    });

    const result = {
      openings: rows.map(opening => ({
        ...opening.toJSON(),
        winRates: opening.popularity > 0 ? {
          white: ((opening.white_wins / opening.popularity) * 100).toFixed(1),
          black: ((opening.black_wins / opening.popularity) * 100).toFixed(1),
          draw: ((opening.draws / opening.popularity) * 100).toFixed(1)
        } : { white: 0, black: 0, draw: 0 }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1
      },
      eco_group: eco_group.toUpperCase()
    };

    res.status(HTTP_STATUS.OK).json(
      formatResponse(
        true,
        result,
        `ECO ${eco_group.toUpperCase()} openings retrieved successfully`,
        null,
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    logger.error('Failed to get openings by ECO', { 
      error: error.message, 
      eco_group: req.params.eco_group 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ECO_OPENINGS_FAILED')
    );
  }
}

/**
 * Get opening statistics (placeholder)
 */
async function getOpeningStats(req, res) {
  try {
    logger.info('Opening statistics request', { 
      requestingUserId: req.user?.id
    });

    // TODO: Implement opening statistics
    // This could include:
    // - Total number of openings in database
    // - Most/least popular openings
    // - ECO distribution
    // - Average success rates by opening type
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Opening statistics not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get opening statistics', { 
      error: error.message 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'OPENING_STATS_FAILED')
    );
  }
}

/**
 * Get opening recommendations for user (placeholder)
 */
async function getOpeningRecommendations(req, res) {
  try {
    const userId = req.user.id;
    const { color, style } = req.query; // 'white'/'black', 'aggressive'/'positional'

    logger.info('Opening recommendations request', { 
      userId, 
      color, 
      style
    });

    // TODO: Implement opening recommendations
    // Based on user's:
    // - Playing style analysis
    // - Current rating level
    // - Past opening performance
    // - Preferred game types
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Opening recommendations not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get opening recommendations', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'OPENING_RECOMMENDATIONS_FAILED')
    );
  }
}

/**
 * Get user's opening repertoire (placeholder)
 */
async function getUserRepertoire(req, res) {
  try {
    const { userId } = req.params;
    const { color } = req.query; // 'white' or 'black'

    logger.info('User repertoire request', { 
      userId, 
      color,
      requestingUserId: req.user?.id
    });

    // TODO: Implement user repertoire analysis
    // Analyze user's games to show:
    // - Most frequently played openings
    // - Success rates with each opening
    // - Recommended improvements
    // - Gaps in repertoire
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'User repertoire analysis not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get user repertoire', { 
      error: error.message, 
      userId: req.params.userId 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'USER_REPERTOIRE_FAILED')
    );
  }
}

/**
 * Add opening to favorites (placeholder)
 */
async function addToFavorites(req, res) {
  try {
    const userId = req.user.id;
    const { openingId } = req.params;

    logger.info('Add opening to favorites request', { 
      userId, 
      openingId
    });

    // TODO: Implement opening favorites
    // Allow users to:
    // - Save favorite openings
    // - Organize them by color/style
    // - Get quick access for study
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatResponse(false, null, 'Opening favorites not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to add opening to favorites', { 
      error: error.message, 
      userId: req.user?.id,
      openingId: req.params.openingId
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatResponse(false, null, error.message, 'ADD_FAVORITE_FAILED')
    );
  }
}

module.exports = {
  searchOpenings,
  getOpeningDetails,
  getPopularOpenings,
  getOpeningsByECO,
  getOpeningStats,
  getOpeningRecommendations,
  getUserRepertoire,
  addToFavorites
};
