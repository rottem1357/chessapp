/**
 * Application Constants
 * 
 * This file contains all the constants used throughout the chess application.
 * Centralizing constants makes the code more maintainable and reduces duplication.
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  TIMEOUT: 10000, // 10 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  GAMES: '/api/games',
  AI_GAME: '/api/ai/game',
  AI_DIFFICULTIES: '/api/ai/difficulties',
  WEBSOCKET: '/socket.io',
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  GAME: '/game/:gameId',
  LOCAL_GAME: '/local-game',
  AI_GAME: '/ai-game/:gameId',
  MULTIPLAYER_GAME: '/multiplayer/:gameId',
};

// Game Status Constants
export const GAME_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
  PAUSED: 'paused',
  WAITING: 'waiting',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  DRAW: 'draw',
  RESIGNED: 'resigned',
  ABANDONED: 'abandoned',
  OPPONENT_DISCONNECTED: 'opponent-disconnected',
};

// Player Colors
export const PLAYER_COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

// Chess Piece Colors (chess.js notation)
export const PIECE_COLORS = {
  WHITE: 'w',
  BLACK: 'b',
};

// AI Difficulty Levels
export const AI_DIFFICULTIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Game events
  JOIN_QUEUE: 'join-queue',
  LEAVE_QUEUE: 'leave-queue',
  QUEUE_JOINED: 'queue-joined',
  MATCH_FOUND: 'match-found',
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  MAKE_MOVE: 'make-move',
  MOVE_MADE: 'move-made',
  INVALID_MOVE: 'invalid-move',
  RESIGN: 'resign',
  DRAW_OFFER: 'draw-offer',
  DRAW_ACCEPTED: 'draw-accepted',
  DRAW_DECLINED: 'draw-declined',
  
  // Chat events
  CHAT_MESSAGE: 'chat-message',
  START_TYPING: 'start-typing',
  STOP_TYPING: 'stop-typing',
  CHAT_ERROR: 'chat-error',
  
  // Error events
  ERROR: 'error',
  QUEUE_ERROR: 'queue-error',
  OPPONENT_DISCONNECTED: 'opponent-disconnected',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  GAME_STATE: 'chess_game_',
  USER_PREFERENCES: 'chess_user_preferences',
  GAME_HISTORY: 'chess_game_history',
};

// UI Constants
export const UI_CONSTANTS = {
  MAX_PLAYER_NAME_LENGTH: 20,
  MAX_CHAT_MESSAGE_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 200,
  DEFAULT_BOARD_SIZE: 400,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  ERROR_DISPLAY_TIME: 5000,
  QUEUE_UPDATE_INTERVAL: 1000,
};

// Chess Board Configuration
export const BOARD_CONFIG = {
  LIGHT_SQUARE_COLOR: '#f0d9b5',
  DARK_SQUARE_COLOR: '#b58863',
  HIGHLIGHT_COLOR: '#ffff99',
  CHECK_COLOR: '#ff6b6b',
  LAST_MOVE_COLOR: '#ffff99',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  INVALID_MOVE: 'Invalid move. Please try again.',
  GAME_NOT_FOUND: 'Game not found. Please check the game ID.',
  PLAYER_NAME_REQUIRED: 'Please enter your name to continue.',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  CONNECTION_REQUIRED: 'Connection to server required for multiplayer games.',
  QUEUE_ERROR: 'Failed to join matchmaking queue. Please try again.',
  OPPONENT_DISCONNECTED: 'Your opponent has disconnected.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully!',
  MOVE_MADE: 'Move made successfully!',
  GAME_JOINED: 'Successfully joined the game!',
  CONNECTED: 'Connected to server!',
};

// Game Rules
export const GAME_RULES = {
  CHESS_BOARD_SIZE: 8,
  TOTAL_PIECES: 32,
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  PIECE_SYMBOLS: {
    KING: 'k',
    QUEEN: 'q',
    ROOK: 'r',
    BISHOP: 'b',
    KNIGHT: 'n',
    PAWN: 'p',
  },
};

// Validation Rules
export const VALIDATION_RULES = {
  PLAYER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_\s]+$/,
  },
  CHAT_MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  GAME_ID: {
    PATTERN: /^[a-zA-Z0-9-_]+$/,
  },
};

// Time Constants
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Default Values
export const DEFAULT_VALUES = {
  PLAYER_RATING: 1200,
  AI_DIFFICULTY: AI_DIFFICULTIES.INTERMEDIATE,
  PLAYER_COLOR: PLAYER_COLORS.WHITE,
  GAME_STATUS: GAME_STATUS.ACTIVE,
  QUEUE_POSITION: 0,
  MOVE_TIME_LIMIT: 5 * TIME_CONSTANTS.MINUTE, // 5 minutes
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_CHAT: true,
  ENABLE_SOUND: false,
  ENABLE_ANIMATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_AI_HINTS: false,
};