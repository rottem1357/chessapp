import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Current game state - matching your backend Game model exactly
  currentGame: null,
  gameId: null,
  gameType: 'rapid',
  timeControl: '10+0',
  timeLimitSeconds: 600,
  incrementSeconds: 0,
  status: 'waiting',
  result: null,
  resultReason: null,
  currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  currentTurn: 'white',
  moveCount: 0,
  whiteTimeRemaining: null,  // milliseconds
  blackTimeRemaining: null,  // milliseconds
  lastMoveAt: null,
  isRated: true,
  isPrivate: false,
  startedAt: null,
  finishedAt: null,
  
  // Players - from the Player model association
  players: [],
  whitePlayer: null,
  blackPlayer: null,
  playerColor: null, // 'white' | 'black' | null
  
  // Moves history
  moves: [],
  
  // UI state
  isInQueue: false,
  queueStartTime: null,
  
  // Actions
  setCurrentGame: (gameData) => {
    console.log('🎮 Setting game state:', gameData);
    set({
      currentGame: gameData,
      gameId: gameData.id,
      gameType: gameData.game_type,
      timeControl: gameData.time_control,
      timeLimitSeconds: gameData.time_limit_seconds,
      incrementSeconds: gameData.increment_seconds,
      status: gameData.status,
      result: gameData.result,
      resultReason: gameData.result_reason,
      currentFen: gameData.current_fen,
      currentTurn: gameData.current_turn,
      moveCount: gameData.move_count,
      whiteTimeRemaining: gameData.white_time_remaining,
      blackTimeRemaining: gameData.black_time_remaining,
      lastMoveAt: gameData.last_move_at,
      isRated: gameData.is_rated,
      isPrivate: gameData.is_private,
      startedAt: gameData.started_at,
      finishedAt: gameData.finished_at,
      players: gameData.players || [],
    });
    
    // Set player colors and find which color the current user is
    if (gameData.players && gameData.players.length >= 2) {
      const whitePlayer = gameData.players.find(p => p.color === 'white');
      const blackPlayer = gameData.players.find(p => p.color === 'black');
      
      set({
        whitePlayer,
        blackPlayer,
      });
    }
  },
  
  setPlayerColor: (color) => set({ playerColor: color }),
  
  updateGameState: (gameData) => {
    const currentState = get();
    set({
      ...currentState,
      currentFen: gameData.current_fen || currentState.currentFen,
      currentTurn: gameData.current_turn || currentState.currentTurn,
      status: gameData.status || currentState.status,
      whiteTimeRemaining: gameData.white_time_remaining ?? currentState.whiteTimeRemaining,
      blackTimeRemaining: gameData.black_time_remaining ?? currentState.blackTimeRemaining,
      lastMoveAt: gameData.last_move_at || currentState.lastMoveAt,
      moveCount: gameData.move_count ?? currentState.moveCount,
      result: gameData.result || currentState.result,
      resultReason: gameData.result_reason || currentState.resultReason,
    });
  },
  
  addMove: (moveData) => {
    const currentMoves = get().moves;
    set({
      moves: [...currentMoves, moveData],
      moveCount: currentMoves.length + 1,
      currentTurn: get().currentTurn === 'white' ? 'black' : 'white',
      lastMoveAt: new Date().toISOString(),
    });
  },
  
  setMoves: (moves) => set({ moves }),
  
  // Queue management
  joinQueue: () => set({ 
    isInQueue: true, 
    queueStartTime: Date.now() 
  }),
  
  leaveQueue: () => set({ 
    isInQueue: false, 
    queueStartTime: null 
  }),
  
  // Time management
  updateTimeRemaining: (color, timeMs) => set((state) => ({
    [`${color}TimeRemaining`]: timeMs,
    lastMoveAt: new Date().toISOString()
  })),
  
  // Reset game state
  resetGame: () => set({
    currentGame: null,
    gameId: null,
    gameType: 'rapid',
    timeControl: '10+0',
    timeLimitSeconds: 600,
    incrementSeconds: 0,
    status: 'waiting',
    result: null,
    resultReason: null,
    currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    currentTurn: 'white',
    moveCount: 0,
    whiteTimeRemaining: null,
    blackTimeRemaining: null,
    lastMoveAt: null,
    isRated: true,
    isPrivate: false,
    startedAt: null,
    finishedAt: null,
    players: [],
    whitePlayer: null,
    blackPlayer: null,
    playerColor: null,
    moves: [],
    isInQueue: false,
    queueStartTime: null,
  }),
}));
