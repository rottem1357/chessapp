/**
 * Game API Service
 * 
 * This module provides game-specific API endpoints and handles
 * all game-related communications with the backend server.
 */

import { api, handleApiResponse } from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Game API Service
 */
export const gameApi = {
  /**
   * Create a new multiplayer game
   * @param {Object} gameData - Game creation data
   * @param {string} gameData.playerName - Player name
   * @param {number} gameData.rating - Player rating
   * @returns {Promise} API response
   */
  async createGame(gameData) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}`, gameData)
    );
  },

  /**
   * Join an existing game
   * @param {string} gameId - Game ID to join
   * @param {Object} playerData - Player data
   * @returns {Promise} API response
   */
  async joinGame(gameId, playerData) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/join`, playerData)
    );
  },

  /**
   * Get game state
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async getGameState(gameId) {
    return handleApiResponse(
      api.get(`${API_ENDPOINTS.GAMES}/${gameId}`)
    );
  },

  /**
   * Make a move in the game
   * @param {string} gameId - Game ID
   * @param {Object} moveData - Move data
   * @param {string} moveData.from - Source square
   * @param {string} moveData.to - Target square
   * @param {string} moveData.promotion - Promotion piece (optional)
   * @returns {Promise} API response
   */
  async makeMove(gameId, moveData) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/move`, moveData)
    );
  },

  /**
   * Resign from the game
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async resignGame(gameId) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/resign`)
    );
  },

  /**
   * Offer a draw
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async offerDraw(gameId) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/draw-offer`)
    );
  },

  /**
   * Accept a draw offer
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async acceptDraw(gameId) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/draw-accept`)
    );
  },

  /**
   * Decline a draw offer
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async declineDraw(gameId) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.GAMES}/${gameId}/draw-decline`)
    );
  },

  /**
   * Get game history
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async getGameHistory(gameId) {
    return handleApiResponse(
      api.get(`${API_ENDPOINTS.GAMES}/${gameId}/history`)
    );
  },

  /**
   * Get list of active games
   * @param {Object} filters - Filter options
   * @returns {Promise} API response
   */
  async getActiveGames(filters = {}) {
    return handleApiResponse(
      api.get(API_ENDPOINTS.GAMES, { params: filters })
    );
  },
};

/**
 * AI Game API Service
 */
export const aiGameApi = {
  /**
   * Create a new AI game
   * @param {Object} gameData - AI game creation data
   * @param {string} gameData.difficulty - AI difficulty level
   * @param {string} gameData.playerColor - Player color preference
   * @param {string} gameData.playerId - Player identifier
   * @returns {Promise} API response
   */
  async createAIGame(gameData) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.AI_GAME}/new`, gameData)
    );
  },

  /**
   * Get AI game state
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async getAIGameState(gameId) {
    return handleApiResponse(
      api.get(`${API_ENDPOINTS.AI_GAME}/${gameId}`)
    );
  },

  /**
   * Make a move in AI game
   * @param {string} gameId - Game ID
   * @param {Object} moveData - Move data
   * @returns {Promise} API response
   */
  async makeAIMove(gameId, moveData) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.AI_GAME}/${gameId}/move`, moveData)
    );
  },

  /**
   * Get available AI difficulty levels
   * @returns {Promise} API response
   */
  async getAIDifficulties() {
    return handleApiResponse(
      api.get(API_ENDPOINTS.AI_DIFFICULTIES)
    );
  },

  /**
   * Get AI game analysis
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async getAIGameAnalysis(gameId) {
    return handleApiResponse(
      api.get(`${API_ENDPOINTS.AI_GAME}/${gameId}/analysis`)
    );
  },

  /**
   * Get AI move hint
   * @param {string} gameId - Game ID
   * @param {string} position - Current position (FEN)
   * @returns {Promise} API response
   */
  async getAIHint(gameId, position) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.AI_GAME}/${gameId}/hint`, { position })
    );
  },

  /**
   * Restart AI game
   * @param {string} gameId - Game ID
   * @param {Object} options - Restart options
   * @returns {Promise} API response
   */
  async restartAIGame(gameId, options = {}) {
    return handleApiResponse(
      api.post(`${API_ENDPOINTS.AI_GAME}/${gameId}/restart`, options)
    );
  },
};

/**
 * Queue API Service
 */
export const queueApi = {
  /**
   * Join matchmaking queue
   * @param {Object} playerData - Player data
   * @returns {Promise} API response
   */
  async joinQueue(playerData) {
    return handleApiResponse(
      api.post('/api/queue/join', playerData)
    );
  },

  /**
   * Leave matchmaking queue
   * @param {string} playerId - Player ID
   * @returns {Promise} API response
   */
  async leaveQueue(playerId) {
    return handleApiResponse(
      api.post('/api/queue/leave', { playerId })
    );
  },

  /**
   * Get queue status
   * @param {string} playerId - Player ID
   * @returns {Promise} API response
   */
  async getQueueStatus(playerId) {
    return handleApiResponse(
      api.get(`/api/queue/status/${playerId}`)
    );
  },
};

/**
 * Statistics API Service
 */
export const statsApi = {
  /**
   * Get player statistics
   * @param {string} playerId - Player ID
   * @returns {Promise} API response
   */
  async getPlayerStats(playerId) {
    return handleApiResponse(
      api.get(`/api/stats/player/${playerId}`)
    );
  },

  /**
   * Get game statistics
   * @param {string} gameId - Game ID
   * @returns {Promise} API response
   */
  async getGameStats(gameId) {
    return handleApiResponse(
      api.get(`/api/stats/game/${gameId}`)
    );
  },

  /**
   * Get leaderboard
   * @param {Object} options - Leaderboard options
   * @returns {Promise} API response
   */
  async getLeaderboard(options = {}) {
    return handleApiResponse(
      api.get('/api/stats/leaderboard', { params: options })
    );
  },
};

export default {
  gameApi,
  aiGameApi,
  queueApi,
  statsApi,
};
