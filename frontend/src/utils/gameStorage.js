// Utility functions for game state persistence
export const saveGameState = (gameId, gameState) => {
  try {
    const gameData = {
      ...gameState,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`chess_game_${gameId}`, JSON.stringify(gameData));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

export const loadGameState = (gameId) => {
  try {
    const savedData = localStorage.getItem(`chess_game_${gameId}`);
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error loading game state:', error);
  }
  return null;
};

export const clearGameState = (gameId) => {
  try {
    localStorage.removeItem(`chess_game_${gameId}`);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
};

export const getAllSavedGames = () => {
  try {
    const savedGames = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chess_game_')) {
        const gameData = JSON.parse(localStorage.getItem(key));
        savedGames.push({
          id: key.replace('chess_game_', ''),
          ...gameData
        });
      }
    }
    return savedGames;
  } catch (error) {
    console.error('Error getting saved games:', error);
    return [];
  }
};
