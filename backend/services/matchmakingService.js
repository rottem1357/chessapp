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
    
    // Start queue processing
    this.startQueueProcessor();
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
        joinedAt: new Date()
      };

      this.queues[gameType].push(queueEntry);

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
        estimatedWaitTime: this.estimateWaitTime(gameType)
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

      for (const [gameType, queue] of Object.entries(this.queues)) {
        const index = queue.findIndex(entry => entry.userId === userId);
        if (index !== -1) {
          queue.splice(index, 1);
          removedFrom = gameType;
          break;
        }
      }

      if (removedFrom) {
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
            joinedAt: queue[index].joinedAt
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

      logger.info('Matched game created', { 
        gameId: game.id,
        player1: player1.userId,
        player2: player2.userId,
        gameType: player1.gameType
      });

      return {
        message: 'Match found!',
        game: game,
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
            await this.createMatchedGame(player1, match);
            processed.add(i);
            processed.add(player2Index);
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
        logger.info('Removing old queue entry', { userId: queue[i].userId });
        queue.splice(i, 1);
      }
    }
  }
}

module.exports = new MatchmakingService();