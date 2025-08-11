// services/matchmakingService.js
const db = require('../models');
const logger = require('../utils/logger');

class MatchmakingService {
  constructor() {
    this.queues = {
      rapid: [],
      blitz: [],
      bullet: []
    };
    this.isProcessing = false;
    this.socketService = null;
    this.queueHistory = new Map(); // userId -> array of queue sessions
    this.matchHistory = new Map(); // userId -> array of matches
    
    // Start queue processing only in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      this.startQueueProcessor();
    }
  }

  /**
   * Set socket service for notifications
   */
  setSocketService(socketService) {
    this.socketService = socketService;
  }

  /**
   * Join matchmaking queue
   */
  async joinQueue(userId, queueData) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const gameType = queueData.game_type;
      const userRating = user[`rating_${gameType}`] || user.rating_rapid;

      // Remove user from any existing queues
      this.removeFromAllQueues(userId);

      const queueEntry = {
        userId,
        username: user.username,
        displayName: user.display_name,
        rating: userRating,
        gameType,
        timeControl: queueData.time_control || '10+0',
        ratingRange: queueData.rating_range || { min: userRating - 200, max: userRating + 200 },
        joinedAt: new Date(),
        sessionId: this.generateSessionId()
      };

      this.queues[gameType].push(queueEntry);

      // Track queue session
      this.trackQueueSession(userId, queueEntry);

      logger.info('User joined matchmaking queue', { 
        userId, 
        gameType, 
        rating: userRating,
        queueSize: this.queues[gameType].length 
      });

      // Try to find a match immediately
      const match = this.findMatch(queueEntry);
      if (match) {
        return await this.createMatchedGame(queueEntry, match);
      }

      return {
        message: 'Joined queue successfully',
        position: this.queues[gameType].length,
        estimatedWaitTime: this.estimateWaitTime(gameType),
        sessionId: queueEntry.sessionId
      };
    } catch (error) {
      logger.error('Failed to join queue', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Leave matchmaking queue
   */
  async leaveQueue(userId) {
    try {
      let removedFrom = null;
      let sessionId = null;

      for (const [gameType, queue] of Object.entries(this.queues)) {
        const index = queue.findIndex(entry => entry.userId === userId);
        if (index !== -1) {
          sessionId = queue[index].sessionId;
          queue.splice(index, 1);
          removedFrom = gameType;
          break;
        }
      }

      if (removedFrom) {
        // Update queue session as manually left
        this.updateQueueSession(userId, sessionId, 'left', new Date());
        
        logger.info('User left matchmaking queue', { userId, gameType: removedFrom });
        return { message: 'Left queue successfully' };
      } else {
        return { message: 'Not in any queue' };
      }
    } catch (error) {
      logger.error('Failed to leave queue', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get queue status for user
   */
  async getQueueStatus(userId) {
    try {
      for (const [gameType, queue] of Object.entries(this.queues)) {
        const index = queue.findIndex(entry => entry.userId === userId);
        if (index !== -1) {
          return {
            inQueue: true,
            gameType,
            position: index + 1,
            totalInQueue: queue.length,
            estimatedWaitTime: this.estimateWaitTime(gameType),
            joinedAt: queue[index].joinedAt,
            sessionId: queue[index].sessionId
          };
        }
      }

      return {
        inQueue: false,
        queueSizes: {
          rapid: this.queues.rapid.length,
          blitz: this.queues.blitz.length,
          bullet: this.queues.bullet.length
        }
      };
    } catch (error) {
      logger.error('Failed to get queue status', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get global queue statistics
   */
  async getGlobalStats() {
    try {
      const stats = {
        queueSizes: {
          rapid: this.queues.rapid.length,
          blitz: this.queues.blitz.length,
          bullet: this.queues.bullet.length
        },
        totalPlayers: this.queues.rapid.length + this.queues.blitz.length + this.queues.bullet.length,
        averageWaitTimes: {
          rapid: this.estimateWaitTime('rapid'),
          blitz: this.estimateWaitTime('blitz'),
          bullet: this.estimateWaitTime('bullet')
        },
        timestamp: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get global stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed statistics for authenticated user
   */
  async getDetailedStats(userId) {
    try {
      const globalStats = await this.getGlobalStats();
      const userHistory = this.queueHistory.get(userId) || [];
      const userMatches = this.matchHistory.get(userId) || [];

      return {
        ...globalStats,
        userStats: {
          sessionsToday: userHistory.filter(s => this.isToday(s.joinedAt)).length,
          averageWaitTime: this.calculateAverageWaitTime(userHistory),
          matchesFound: userMatches.length,
          successRate: userHistory.length > 0 ? (userMatches.length / userHistory.length) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Failed to get detailed stats', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user preferences (stored in memory for now)
   */
  async getUserPreferences(userId) {
    // TODO: Implement database storage for preferences
    const defaultPreferences = {
      preferredTimeControls: ['10+0', '15+10'],
      maxRatingRange: 200,
      autoAcceptMatches: false,
      notificationsEnabled: true,
      preferredGameTypes: ['rapid', 'blitz']
    };

    return defaultPreferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    // TODO: Implement database storage for preferences
    logger.info('Updating user preferences', { userId, preferences });
    
    return {
      message: 'Preferences updated successfully',
      preferences
    };
  }

  /**
   * Get queue history for user
   */
  async getQueueHistory(userId, page = 1, limit = 20) {
    try {
      const userHistory = this.queueHistory.get(userId) || [];
      const offset = (page - 1) * limit;
      const paginatedHistory = userHistory.slice(offset, offset + limit);

      return {
        history: paginatedHistory,
        pagination: {
          page,
          limit,
          total: userHistory.length,
          pages: Math.ceil(userHistory.length / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get queue history', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get optimal queue times
   */
  async getOptimalQueueTimes(gameType, timezone) {
    try {
      // TODO: Implement actual analytics based on historical data
      const mockOptimalTimes = {
        weekdays: {
          peak: ['18:00', '19:00', '20:00', '21:00'],
          good: ['17:00', '22:00'],
          average: ['12:00', '13:00', '14:00', '15:00', '16:00']
        },
        weekends: {
          peak: ['14:00', '15:00', '16:00', '19:00', '20:00', '21:00'],
          good: ['11:00', '12:00', '13:00', '17:00', '18:00', '22:00'],
          average: ['10:00', '23:00']
        },
        averageWaitTimes: {
          peak: 15,
          good: 45,
          average: 120
        }
      };

      return mockOptimalTimes;
    } catch (error) {
      logger.error('Failed to get optimal queue times', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel a pending match
   */
  async cancelMatch(userId, matchId) {
    try {
      // TODO: Implement match cancellation logic
      logger.info('Match cancellation requested', { userId, matchId });
      
      return {
        message: 'Match cancellation requested',
        matchId
      };
    } catch (error) {
      logger.error('Failed to cancel match', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Report matchmaking issues
   */
  async reportIssue(userId, issueData) {
    try {
      const report = {
        id: this.generateSessionId(),
        userId,
        ...issueData,
        reportedAt: new Date(),
        status: 'pending'
      };

      // TODO: Store in database
      logger.info('Matchmaking issue reported', report);
      
      return {
        message: 'Issue reported successfully',
        reportId: report.id
      };
    } catch (error) {
      logger.error('Failed to report issue', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get admin queue data
   */
  async getAdminQueueData() {
    try {
      const queueData = {
        queues: {
          rapid: this.queues.rapid.map(entry => ({
            ...entry,
            waitTime: Date.now() - entry.joinedAt.getTime()
          })),
          blitz: this.queues.blitz.map(entry => ({
            ...entry,
            waitTime: Date.now() - entry.joinedAt.getTime()
          })),
          bullet: this.queues.bullet.map(entry => ({
            ...entry,
            waitTime: Date.now() - entry.joinedAt.getTime()
          }))
        },
        processingStatus: {
          isProcessing: this.isProcessing,
          lastProcessedAt: new Date()
        }
      };

      return queueData;
    } catch (error) {
      logger.error('Failed to get admin queue data', { error: error.message });
      throw error;
    }
  }

  // Helper methods

  /**
   * Find a match for a queue entry
   */
  findMatch(queueEntry) {
    const queue = this.queues[queueEntry.gameType];
    
    for (const opponent of queue) {
      if (opponent.userId === queueEntry.userId) continue;
      
      // Check rating range compatibility
      const ratingDiff = Math.abs(queueEntry.rating - opponent.rating);
      const maxRatingDiff = Math.max(
        queueEntry.ratingRange.max - queueEntry.ratingRange.min,
        opponent.ratingRange.max - opponent.ratingRange.min
      );
      
      if (ratingDiff <= maxRatingDiff / 2) {
        // Check time control compatibility
        if (queueEntry.timeControl === opponent.timeControl) {
          return opponent;
        }
      }
    }
    
    return null;
  }

  /**
   * Create a matched game
   */
  async createMatchedGame(player1, player2) {
    try {
      // Remove both players from queue
      this.removeFromQueue(player1.userId, player1.gameType);
      this.removeFromQueue(player2.userId, player2.gameType);

      // Update queue sessions as matched
      this.updateQueueSession(player1.userId, player1.sessionId, 'matched', new Date());
      this.updateQueueSession(player2.userId, player2.sessionId, 'matched', new Date());

      // Randomly assign colors
      const player1IsWhite = Math.random() > 0.5;
      
      const gameService = require('./gameService');
      
      // Create game with first player
      const game = await gameService.createGame(player1.userId, {
        game_type: player1.gameType,
        time_control: player1.timeControl,
        is_rated: true,
        preferred_color: player1IsWhite ? 'white' : 'black'
      });

      // Add second player
      await gameService.joinGame(game.id, player2.userId);

      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get fresh game data with both players
      const completeGame = await gameService.getGameById(game.id);

      // Track successful match
      this.trackMatch(player1.userId, player2.userId, game.id);
      this.trackMatch(player2.userId, player1.userId, game.id);

      logger.info('Matched game created', { 
        gameId: game.id,
        player1: player1.userId,
        player2: player2.userId,
        gameType: player1.gameType,
        playerCount: completeGame?.players?.length || 0
      });

      // Notify socket service about the game creation
      if (this.socketService) {
        this.socketService.notifyGameStart(completeGame);
      }

      return {
        message: 'Match found!',
        game: completeGame,
        opponent: {
          username: player2.username,
          displayName: player2.displayName,
          rating: player2.rating
        }
      };
    } catch (error) {
      logger.error('Failed to create matched game', { error: error.message });
      throw error;
    }
  }

  /**
   * Remove user from specific queue
   */
  removeFromQueue(userId, gameType) {
    const queue = this.queues[gameType];
    const index = queue.findIndex(entry => entry.userId === userId);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  /**
   * Remove user from all queues
   */
  removeFromAllQueues(userId) {
    for (const queue of Object.values(this.queues)) {
      const index = queue.findIndex(entry => entry.userId === userId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  /**
   * Estimate wait time
   */
  estimateWaitTime(gameType) {
    const queueSize = this.queues[gameType].length;
    // Simple estimation: 30 seconds base + 15 seconds per person ahead
    return Math.max(30, queueSize * 15);
  }

  /**
   * Track queue session
   */
  trackQueueSession(userId, queueEntry) {
    if (!this.queueHistory.has(userId)) {
      this.queueHistory.set(userId, []);
    }

    const session = {
      sessionId: queueEntry.sessionId,
      gameType: queueEntry.gameType,
      timeControl: queueEntry.timeControl,
      joinedAt: queueEntry.joinedAt,
      leftAt: null,
      outcome: 'active', // active, matched, left, timeout
      waitTime: null
    };

    this.queueHistory.get(userId).push(session);
  }

  /**
   * Update queue session
   */
  updateQueueSession(userId, sessionId, outcome, leftAt) {
    const history = this.queueHistory.get(userId);
    if (history) {
      const session = history.find(s => s.sessionId === sessionId);
      if (session) {
        session.outcome = outcome;
        session.leftAt = leftAt;
        session.waitTime = leftAt.getTime() - session.joinedAt.getTime();
      }
    }
  }

  /**
   * Track successful match
   */
  trackMatch(userId, opponentId, gameId) {
    if (!this.matchHistory.has(userId)) {
      this.matchHistory.set(userId, []);
    }

    const match = {
      gameId,
      opponentId,
      createdAt: new Date()
    };

    this.matchHistory.get(userId).push(match);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check if date is today
   */
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Calculate average wait time from history
   */
  calculateAverageWaitTime(history) {
    const completedSessions = history.filter(s => s.waitTime !== null);
    if (completedSessions.length === 0) return 0;
    
    const totalWaitTime = completedSessions.reduce((sum, s) => sum + s.waitTime, 0);
    return Math.round(totalWaitTime / completedSessions.length / 1000); // Convert to seconds
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processQueues();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process all queues for matches
   */
  async processQueues() {
    this.isProcessing = true;
    
    try {
      for (const [gameType, queue] of Object.entries(this.queues)) {
        if (queue.length >= 2) {
          await this.processQueueMatches(gameType, queue);
        }
        
        // Clean up old queue entries (older than 10 minutes)
        this.cleanupOldEntries(queue);
      }
    } catch (error) {
      logger.error('Error processing queues', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process matches for a specific queue
   */
  async processQueueMatches(gameType, queue) {
    const processed = new Set();
    
    for (let i = 0; i < queue.length; i++) {
      if (processed.has(i)) continue;
      
      const player1 = queue[i];
      const match = this.findMatch(player1);
      
      if (match) {
        const player2Index = queue.findIndex(p => p.userId === match.userId);
        if (player2Index !== -1 && !processed.has(player2Index)) {
          try {
            const gameResult = await this.createMatchedGame(player1, match);
            processed.add(i);
            processed.add(player2Index);
            
            logger.info('Background match created', { 
              gameId: gameResult.game?.id,
              player1: player1.userId,
              player2: match.userId 
            });
          } catch (error) {
            logger.error('Failed to create match in processor', { error: error.message });
          }
        }
      }
    }
  }

  /**
   * Clean up old queue entries
   */
  cleanupOldEntries(queue) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].joinedAt < tenMinutesAgo) {
        const entry = queue[i];
        
        // Update session as timed out
        this.updateQueueSession(entry.userId, entry.sessionId, 'timeout', new Date());
        
        logger.info('Removing old queue entry', { userId: entry.userId });
        queue.splice(i, 1);
      }
    }
  }
}

module.exports = new MatchmakingService();