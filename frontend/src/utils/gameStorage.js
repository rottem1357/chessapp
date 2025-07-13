/**
 * Game Storage Utilities
 * 
 * This module provides utilities for game state persistence using localStorage.
 * It handles saving, loading, and managing chess game data locally.
 */

import { STORAGE_KEYS } from './constants';
import { logError } from './errorHandler';

/**
 * Save game state to localStorage
 * @param {string} gameId - Unique game identifier
 * @param {Object} gameState - Game state object to save
 * @returns {boolean} Success status
 */
export const saveGameState = (gameId, gameState) => {
  try {
    const gameData = {
      ...gameState,
      timestamp: new Date().toISOString(),
      version: '1.0', // For future compatibility
    };
    
    const storageKey = `${STORAGE_KEYS.GAME_STATE}${gameId}`;
    localStorage.setItem(storageKey, JSON.stringify(gameData));
    
    return true;
  } catch (error) {
    logError(error, 'Save Game State', { gameId });
    return false;
  }
};

/**
 * Load game state from localStorage
 * @param {string} gameId - Unique game identifier
 * @returns {Object|null} Game state object or null if not found
 */
export const loadGameState = (gameId) => {
  try {
    const storageKey = `${STORAGE_KEYS.GAME_STATE}${gameId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const gameData = JSON.parse(savedData);
      
      // Validate data structure
      if (gameData && typeof gameData === 'object' && gameData.fen) {
        return gameData;
      }
    }
    
    return null;
  } catch (error) {
    logError(error, 'Load Game State', { gameId });
    return null;
  }
};

/**
 * Clear game state from localStorage
 * @param {string} gameId - Unique game identifier
 * @returns {boolean} Success status
 */
export const clearGameState = (gameId) => {
  try {
    const storageKey = `${STORAGE_KEYS.GAME_STATE}${gameId}`;
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    logError(error, 'Clear Game State', { gameId });
    return false;
  }
};

/**
 * Get all saved games from localStorage
 * @returns {Array} Array of saved game objects
 */
export const getAllSavedGames = () => {
  try {
    const savedGames = [];
    const prefix = STORAGE_KEYS.GAME_STATE;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        const gameData = JSON.parse(localStorage.getItem(key));
        
        if (gameData && typeof gameData === 'object') {
          savedGames.push({
            id: key.replace(prefix, ''),
            ...gameData
          });
        }
      }
    }
    
    // Sort by timestamp (newest first)
    return savedGames.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    logError(error, 'Get All Saved Games');
    return [];
  }
};

/**
 * Check if a game exists in localStorage
 * @param {string} gameId - Unique game identifier
 * @returns {boolean} Whether the game exists
 */
export const gameExists = (gameId) => {
  try {
    const storageKey = `${STORAGE_KEYS.GAME_STATE}${gameId}`;
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    logError(error, 'Check Game Exists', { gameId });
    return false;
  }
};

/**
 * Get game metadata without loading full state
 * @param {string} gameId - Unique game identifier
 * @returns {Object|null} Game metadata or null if not found
 */
export const getGameMetadata = (gameId) => {
  try {
    const storageKey = `${STORAGE_KEYS.GAME_STATE}${gameId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const gameData = JSON.parse(savedData);
      
      return {
        id: gameId,
        timestamp: gameData.timestamp,
        status: gameData.status,
        winner: gameData.winner,
        moveCount: gameData.gameInfo?.moveCount || 0,
        duration: gameData.gameInfo?.duration || 0,
        version: gameData.version || '1.0',
      };
    }
    
    return null;
  } catch (error) {
    logError(error, 'Get Game Metadata', { gameId });
    return null;
  }
};

/**
 * Clear all saved games from localStorage
 * @returns {boolean} Success status
 */
export const clearAllSavedGames = () => {
  try {
    const prefix = STORAGE_KEYS.GAME_STATE;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (error) {
    logError(error, 'Clear All Saved Games');
    return false;
  }
};

/**
 * Get storage usage statistics
 * @returns {Object} Storage statistics
 */
export const getStorageStats = () => {
  try {
    const prefix = STORAGE_KEYS.GAME_STATE;
    let totalSize = 0;
    let gameCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        totalSize += new Blob([value]).size;
        gameCount++;
      }
    }
    
    return {
      gameCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      averageSize: gameCount > 0 ? totalSize / gameCount : 0,
    };
  } catch (error) {
    logError(error, 'Get Storage Stats');
    return {
      gameCount: 0,
      totalSize: 0,
      totalSizeFormatted: '0 B',
      averageSize: 0,
    };
  }
};

/**
 * Clean up old saved games (older than specified days)
 * @param {number} daysOld - Number of days to keep games
 * @returns {number} Number of games cleaned up
 */
export const cleanupOldGames = (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const prefix = STORAGE_KEYS.GAME_STATE;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        const gameData = JSON.parse(localStorage.getItem(key));
        
        if (gameData && gameData.timestamp) {
          const gameDate = new Date(gameData.timestamp);
          if (gameDate < cutoffDate) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return keysToRemove.length;
  } catch (error) {
    logError(error, 'Cleanup Old Games', { daysOld });
    return 0;
  }
};

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Export game data as JSON
 * @param {string} gameId - Unique game identifier
 * @returns {string|null} JSON string or null if error
 */
export const exportGameData = (gameId) => {
  try {
    const gameData = loadGameState(gameId);
    if (gameData) {
      return JSON.stringify(gameData, null, 2);
    }
    return null;
  } catch (error) {
    logError(error, 'Export Game Data', { gameId });
    return null;
  }
};

/**
 * Import game data from JSON
 * @param {string} gameId - Unique game identifier
 * @param {string} jsonData - JSON string data
 * @returns {boolean} Success status
 */
export const importGameData = (gameId, jsonData) => {
  try {
    const gameData = JSON.parse(jsonData);
    
    // Validate data structure
    if (gameData && typeof gameData === 'object' && gameData.fen) {
      return saveGameState(gameId, gameData);
    }
    
    return false;
  } catch (error) {
    logError(error, 'Import Game Data', { gameId });
    return false;
  }
};

const gameStorage = {
  saveGameState,
  loadGameState,
  clearGameState,
  getAllSavedGames,
  gameExists,
  getGameMetadata,
  clearAllSavedGames,
  getStorageStats,
  cleanupOldGames,
  exportGameData,
  importGameData,
};

export default gameStorage;
