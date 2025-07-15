// controllers/adminController.js
const db = require('../models');
const { HTTP_STATUS } = require('../utils/constants');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all users with admin filters
 */
async function getUsers(req, res) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      status,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    logger.info('Admin users list request', { 
      page, 
      limit, 
      search, 
      status,
      adminUserId: req.user.id
    });

    const whereClause = {};
    
    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { display_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        whereClause.is_active = true;
      } else if (status === 'inactive') {
        whereClause.is_active = false;
      } else if (status === 'verified') {
        whereClause.is_verified = true;
      } else if (status === 'unverified') {
        whereClause.is_verified = false;
      } else if (status === 'premium') {
        whereClause.is_premium = true;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSortFields = ['created_at', 'username', 'email', 'games_played', 'rating_rapid', 'last_login'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await db.User.findAndCountAll({
      where: whereClause,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset,
      attributes: { exclude: ['password_hash'] }
    });

    const result = {
      users: rows,
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
      formatSuccessResponse(result, 'Users retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get users for admin', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'ADMIN_USERS_FAILED')
    );
  }
}

/**
 * Get all games with admin filters
 */
async function getGames(req, res) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status,
      game_type,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    logger.info('Admin games list request', { 
      page, 
      limit, 
      status, 
      game_type,
      adminUserId: req.user.id
    });

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (game_type) {
      whereClause.game_type = game_type;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSortFields = ['created_at', 'started_at', 'finished_at', 'move_count', 'game_type'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await db.Game.findAndCountAll({
      where: whereClause,
      include: [{
        model: db.Player,
        as: 'players',
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'display_name']
        }]
      }],
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset
    });

    const result = {
      games: rows,
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
      formatSuccessResponse(result, 'Games retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get games for admin', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'ADMIN_GAMES_FAILED')
    );
  }
}

/**
 * Get system reports and issues
 */
async function getReports(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,
      status = 'pending'
    } = req.query;

    logger.info('Admin reports request', { 
      page, 
      limit, 
      type, 
      status,
      adminUserId: req.user.id
    });

    // TODO: Implement reports system
    // This would include:
    // - User reports (cheating, abuse, etc.)
    // - System error reports
    // - Bug reports
    // - Content moderation issues
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Reports system not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get reports for admin', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'ADMIN_REPORTS_FAILED')
    );
  }
}

/**
 * Get comprehensive admin statistics
 */
async function getAdminStats(req, res) {
  try {
    logger.info('Admin statistics request', { 
      adminUserId: req.user.id
    });

    // Get user statistics
    const totalUsers = await db.User.count();
    const activeUsers = await db.User.count({ where: { is_active: true } });
    const verifiedUsers = await db.User.count({ where: { is_verified: true } });
    const premiumUsers = await db.User.count({ where: { is_premium: true } });

    // Get game statistics
    const totalGames = await db.Game.count();
    const activeGames = await db.Game.count({ where: { status: 'active' } });
    const completedGames = await db.Game.count({ where: { status: 'finished' } });

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsersToday = await db.User.count({ 
      where: { created_at: { [Op.gte]: yesterday } }
    });
    const gamesToday = await db.Game.count({ 
      where: { created_at: { [Op.gte]: yesterday } }
    });

    // Get puzzle statistics
    const totalPuzzles = await db.Puzzle.count();
    const puzzleAttempts = await db.PuzzleAttempt.count();

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        premium: premiumUsers,
        newToday: newUsersToday
      },
      games: {
        total: totalGames,
        active: activeGames,
        completed: completedGames,
        today: gamesToday
      },
      puzzles: {
        total: totalPuzzles,
        attempts: puzzleAttempts
      },
      system: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(stats, 'Admin statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get admin statistics', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'ADMIN_STATS_FAILED')
    );
  }
}

/**
 * Update user status (activate/deactivate/verify)
 */
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // 'activate', 'deactivate', 'verify', 'unverify', 'premium', 'unpremium'

    logger.info('Admin user status update', { 
      userId, 
      action, 
      reason,
      adminUserId: req.user.id
    });

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatErrorResponse('User not found', 'USER_NOT_FOUND')
      );
    }

    const updates = {};
    let message = '';

    switch (action) {
      case 'activate':
        updates.is_active = true;
        message = 'User activated successfully';
        break;
      case 'deactivate':
        updates.is_active = false;
        message = 'User deactivated successfully';
        break;
      case 'verify':
        updates.is_verified = true;
        message = 'User verified successfully';
        break;
      case 'unverify':
        updates.is_verified = false;
        message = 'User verification removed successfully';
        break;
      case 'premium':
        updates.is_premium = true;
        message = 'User granted premium status';
        break;
      case 'unpremium':
        updates.is_premium = false;
        message = 'User premium status removed';
        break;
      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse('Invalid action', 'INVALID_ACTION')
        );
    }

    await db.User.update(updates, { where: { id: userId } });

    // TODO: Log admin action for audit trail

    logger.info('User status updated by admin', { 
      userId, 
      action, 
      adminUserId: req.user.id 
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse({ userId, action }, message)
    );
  } catch (error) {
    logger.error('Failed to update user status', { 
      error: error.message, 
      userId: req.params.userId,
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'USER_STATUS_UPDATE_FAILED')
    );
  }
}

/**
 * Force end a game (admin intervention)
 */
async function forceEndGame(req, res) {
  try {
    const { gameId } = req.params;
    const { reason, result } = req.body;

    logger.info('Admin force end game', { 
      gameId, 
      reason, 
      result,
      adminUserId: req.user.id
    });

    const game = await db.Game.findByPk(gameId);
    if (!game) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatErrorResponse('Game not found', 'GAME_NOT_FOUND')
      );
    }

    if (game.status === 'finished') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatErrorResponse('Game is already finished', 'GAME_ALREADY_FINISHED')
      );
    }

    await db.Game.update({
      status: 'aborted',
      result: result || 'aborted',
      result_reason: 'admin_intervention',
      finished_at: new Date()
    }, {
      where: { id: gameId }
    });

    // TODO: Log admin action and notify players

    logger.info('Game force ended by admin', { 
      gameId, 
      reason,
      adminUserId: req.user.id 
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse({ gameId, reason }, 'Game ended successfully')
    );
  } catch (error) {
    logger.error('Failed to force end game', { 
      error: error.message, 
      gameId: req.params.gameId,
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'FORCE_END_GAME_FAILED')
    );
  }
}

/**
 * Get system health and performance metrics
 */
async function getSystemHealth(req, res) {
  try {
    logger.info('System health check request', { 
      adminUserId: req.user.id
    });

    // Basic system metrics
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected' // TODO: Add actual DB health check
      }
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccessResponse(health, 'System health retrieved successfully')
    );
  } catch (error) {
    logger.error('Failed to get system health', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'SYSTEM_HEALTH_FAILED')
    );
  }
}

/**
 * Broadcast system announcement (placeholder)
 */
async function broadcastAnnouncement(req, res) {
  try {
    const { message, type, expires_at } = req.body;

    logger.info('Admin broadcast announcement', { 
      message, 
      type,
      adminUserId: req.user.id
    });

    // TODO: Implement system announcements
    // This would:
    // - Store announcement in database
    // - Broadcast to all connected users via WebSocket
    // - Show in user interface
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('System announcements not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to broadcast announcement', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'BROADCAST_FAILED')
    );
  }
}

/**
 * Get audit logs (placeholder)
 */
async function getAuditLogs(req, res) {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action_type,
      user_id,
      start_date,
      end_date 
    } = req.query;

    logger.info('Admin audit logs request', { 
      page, 
      limit, 
      action_type,
      adminUserId: req.user.id
    });

    // TODO: Implement audit logging system
    // This would track:
    // - Admin actions
    // - User account changes
    // - System modifications
    // - Security events
    
    res.status(HTTP_STATUS.NOT_IMPLEMENTED).json(
      formatErrorResponse('Audit logs not yet implemented', 'NOT_IMPLEMENTED')
    );
  } catch (error) {
    logger.error('Failed to get audit logs', { 
      error: error.message, 
      adminUserId: req.user?.id 
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(error.message, 'AUDIT_LOGS_FAILED')
    );
  }
}

module.exports = {
  getUsers,
  getGames,
  getReports,
  getAdminStats,
  updateUserStatus,
  forceEndGame,
  getSystemHealth,
  broadcastAnnouncement,
  getAuditLogs
};