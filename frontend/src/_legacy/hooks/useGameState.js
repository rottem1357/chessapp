/**
 * useGameState Hook
 * 
 * Custom React hook for managing chess game state with automatic
 * persistence, validation, and state synchronization.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { 
  saveGameState, 
  loadGameState, 
  clearGameState 
} from '../utils/gameStorage';
import { 
  GAME_STATUS, 
  PLAYER_COLORS, 
  PIECE_COLORS 
} from '../utils/constants';
import { 
  chessColorToPlayerColor 
} from '../utils/helpers';
import { validateChessMove, validateFEN } from '../utils/validation';

/**
 * Initial game state
 */
const initialGameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: PLAYER_COLORS.WHITE,
  status: GAME_STATUS.ACTIVE,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
  winner: null,
  moves: [],
  capturedPieces: {
    white: [],
    black: [],
  },
  gameInfo: {
    startTime: null,
    endTime: null,
    duration: 0,
    moveCount: 0,
  },
};

/**
 * Custom hook for chess game state management
 * @param {Object} options - Hook options
 * @param {string} options.gameId - Game ID for persistence
 * @param {string} options.initialFen - Initial FEN position
 * @param {boolean} options.autoPersist - Auto-save game state
 * @returns {Object} Game state and actions
 */
export const useGameState = (options = {}) => {
  const {
    gameId = null,
    initialFen = null,
    autoPersist = true,
  } = options;

  const [gameState, setGameState] = useState(initialGameState);
  const [chess] = useState(new Chess());
  const [lastMove, setLastMove] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  /**
   * Initialize game state
   */
  const initializeGame = useCallback((fen = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load from localStorage if gameId exists
      let savedState = null;
      if (gameId && autoPersist) {
        savedState = loadGameState(gameId);
      }

      // Use saved state, provided FEN, or default
      const startingFen = savedState?.fen || fen || initialFen || initialGameState.fen;
      
      // Validate FEN
      const fenValidation = validateFEN(startingFen);
      if (!fenValidation.isValid) {
        throw new Error(fenValidation.error);
      }

      // Load position into chess engine
      chess.load(startingFen);

      // Create new game state
      const newGameState = {
        ...initialGameState,
        fen: startingFen,
        turn: chessColorToPlayerColor(chess.turn()),
        isCheck: chess.isCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        moves: savedState?.moves || [],
        gameInfo: {
          ...initialGameState.gameInfo,
          startTime: savedState?.gameInfo?.startTime || new Date().toISOString(),
          ...savedState?.gameInfo,
        },
        ...savedState,
      };

      // Update game status
      if (newGameState.isCheckmate) {
        newGameState.status = GAME_STATUS.CHECKMATE;
        newGameState.winner = chessColorToPlayerColor(chess.turn() === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE);
      } else if (newGameState.isStalemate) {
        newGameState.status = GAME_STATUS.STALEMATE;
      } else if (newGameState.isDraw) {
        newGameState.status = GAME_STATUS.DRAW;
      }

      setGameState(newGameState);
      setLastMove(null);
    } catch (err) {
      setError(err.message);
      console.error('Error initializing game:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, initialFen, autoPersist, chess]);

  /**
   * Make a move
   */
  const makeMove = useCallback((from, to, promotion = 'q') => {
    if (gameState.status !== GAME_STATUS.ACTIVE) {
      setError('Game is not active');
      return false;
    }

    // Validate move format
    const moveValidation = validateChessMove({ from, to, promotion });
    if (!moveValidation.isValid) {
      setError(moveValidation.error);
      return false;
    }

    try {
      // Attempt to make the move
      const move = chess.move({
        from: moveValidation.value.from,
        to: moveValidation.value.to,
        promotion: moveValidation.value.promotion,
      });

      if (!move) {
        setError('Invalid move');
        return false;
      }

      // Update game state
      const newGameState = {
        ...gameState,
        fen: chess.fen(),
        turn: chessColorToPlayerColor(chess.turn()),
        isCheck: chess.isCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        moves: [...gameState.moves, move],
        gameInfo: {
          ...gameState.gameInfo,
          moveCount: gameState.gameInfo.moveCount + 1,
        },
      };

      // Update captured pieces
      if (move.captured) {
        const capturedColor = move.color === PIECE_COLORS.WHITE ? PLAYER_COLORS.BLACK : PLAYER_COLORS.WHITE;
        newGameState.capturedPieces = {
          ...gameState.capturedPieces,
          [capturedColor]: [...gameState.capturedPieces[capturedColor], move.captured],
        };
      }

      // Update game status
      if (newGameState.isCheckmate) {
        newGameState.status = GAME_STATUS.CHECKMATE;
        newGameState.winner = chessColorToPlayerColor(move.color);
        newGameState.gameInfo.endTime = new Date().toISOString();
      } else if (newGameState.isStalemate) {
        newGameState.status = GAME_STATUS.STALEMATE;
        newGameState.gameInfo.endTime = new Date().toISOString();
      } else if (newGameState.isDraw) {
        newGameState.status = GAME_STATUS.DRAW;
        newGameState.gameInfo.endTime = new Date().toISOString();
      }

      setGameState(newGameState);
      setLastMove({ from, to });
      setError(null);

      // Auto-persist if enabled
      if (gameId && autoPersist) {
        saveGameState(gameId, newGameState);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error making move:', err);
      return false;
    }
  }, [gameState, chess, gameId, autoPersist]);

  /**
   * Undo last move
   */
  const undoMove = useCallback(() => {
    if (gameState.moves.length === 0) {
      setError('No moves to undo');
      return false;
    }

    try {
      const undoneMove = chess.undo();
      if (!undoneMove) {
        setError('Cannot undo move');
        return false;
      }

      const newMoves = gameState.moves.slice(0, -1);
      const newGameState = {
        ...gameState,
        fen: chess.fen(),
        turn: chessColorToPlayerColor(chess.turn()),
        isCheck: chess.isCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        moves: newMoves,
        status: GAME_STATUS.ACTIVE,
        winner: null,
        gameInfo: {
          ...gameState.gameInfo,
          moveCount: Math.max(0, gameState.gameInfo.moveCount - 1),
          endTime: null,
        },
      };

      // Update captured pieces
      if (undoneMove.captured) {
        const capturedColor = undoneMove.color === PIECE_COLORS.WHITE ? PLAYER_COLORS.BLACK : PLAYER_COLORS.WHITE;
        newGameState.capturedPieces = {
          ...gameState.capturedPieces,
          [capturedColor]: gameState.capturedPieces[capturedColor].slice(0, -1),
        };
      }

      setGameState(newGameState);
      setLastMove(null);
      setError(null);

      // Auto-persist if enabled
      if (gameId && autoPersist) {
        saveGameState(gameId, newGameState);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error undoing move:', err);
      return false;
    }
  }, [gameState, chess, gameId, autoPersist]);

  /**
   * Reset game to initial state
   */
  const resetGame = useCallback(() => {
    chess.reset();
    const newGameState = {
      ...initialGameState,
      gameInfo: {
        ...initialGameState.gameInfo,
        startTime: new Date().toISOString(),
      },
    };
    
    setGameState(newGameState);
    setLastMove(null);
    setError(null);

    // Clear persisted state
    if (gameId && autoPersist) {
      clearGameState(gameId);
    }
  }, [chess, gameId, autoPersist]);

  /**
   * Load game from FEN
   */
  const loadFromFen = useCallback((fen) => {
    initializeGame(fen);
  }, [initializeGame]);

  /**
   * Get possible moves for a square
   */
  const getPossibleMoves = useCallback((square) => {
    if (!square) return [];
    
    try {
      const moves = chess.moves({ square, verbose: true });
      return moves.map(move => move.to);
    } catch (err) {
      console.error('Error getting possible moves:', err);
      return [];
    }
  }, [chess]);

  /**
   * Check if a move is legal
   */
  const isMoveLegal = useCallback((from, to) => {
    try {
      const move = chess.move({ from, to });
      if (move) {
        chess.undo();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, [chess]);

  /**
   * Get game statistics
   */
  const getGameStats = useCallback(() => {
    const startTime = gameState.gameInfo.startTime;
    const endTime = gameState.gameInfo.endTime || new Date().toISOString();
    const duration = startTime ? new Date(endTime) - new Date(startTime) : 0;

    return {
      duration,
      moveCount: gameState.gameInfo.moveCount,
      capturedPieces: gameState.capturedPieces,
      status: gameState.status,
      winner: gameState.winner,
      isFinished: gameState.status !== GAME_STATUS.ACTIVE,
    };
  }, [gameState]);

  /**
   * Initialize game on mount
   */
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  /**
   * Clear error after delay
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // Game state
    gameState,
    lastMove,
    error,
    isLoading,
    
    // Game actions
    makeMove,
    undoMove,
    resetGame,
    loadFromFen,
    
    // Utilities
    getPossibleMoves,
    isMoveLegal,
    getGameStats,
    
    // Game info
    currentPlayer: gameState.turn,
    isGameActive: gameState.status === GAME_STATUS.ACTIVE,
    isGameFinished: gameState.status !== GAME_STATUS.ACTIVE,
    fen: gameState.fen,
    moves: gameState.moves,
    capturedPieces: gameState.capturedPieces,
  };
};
