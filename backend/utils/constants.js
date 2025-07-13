/**
 * Constants
 * Application-wide constants for the chess application
 */

// Game Status Constants
const GAME_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
  DRAW: 'draw',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  RESIGNED: 'resigned'
};

// Player Colors
const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Chess Piece Values (in centipawns)
const PIECE_VALUES = {
  'p': 100,  // Pawn
  'n': 320,  // Knight
  'b': 330,  // Bishop
  'r': 500,  // Rook
  'q': 900,  // Queen
  'k': 20000 // King
};

// AI Difficulty Levels
const AI_DIFFICULTIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

// Socket Events
const SOCKET_EVENTS = {
  // Client to Server
  JOIN_QUEUE: 'join-queue',
  MAKE_MOVE: 'make-move',
  CHAT_MESSAGE: 'chat-message',
  RESIGN: 'resign',
  REQUEST_DRAW: 'request-draw',
  RESPOND_DRAW: 'respond-draw',
  
  // Server to Client
  QUEUE_JOINED: 'queue-joined',
  GAME_STARTED: 'game-started',
  MOVE_MADE: 'move-made',
  INVALID_MOVE: 'invalid-move',
  CHAT_MESSAGE_RECEIVED: 'chat-message',
  GAME_ENDED: 'game-ended',
  OPPONENT_DISCONNECTED: 'opponent-disconnected',
  DRAW_OFFERED: 'draw-offered',
  DRAW_ACCEPTED: 'draw-accepted',
  DRAW_DECLINED: 'draw-declined',
  ERROR: 'error'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
const ERROR_MESSAGES = {
  GAME_NOT_FOUND: 'Game not found',
  INVALID_MOVE: 'Invalid move',
  NOT_YOUR_TURN: 'Not your turn',
  GAME_ALREADY_OVER: 'Game is already over',
  PLAYER_NOT_IN_GAME: 'Player not in this game',
  INVALID_GAME_STATE: 'Invalid game state',
  QUEUE_FULL: 'Matchmaking queue is full',
  AI_SERVICE_UNAVAILABLE: 'AI service is currently unavailable',
  INVALID_DIFFICULTY: 'Invalid AI difficulty level',
  CHAT_MESSAGE_TOO_LONG: 'Chat message is too long',
  INVALID_PLAYER_NAME: 'Invalid player name',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

// Success Messages
const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully',
  MOVE_MADE: 'Move made successfully',
  GAME_ENDED: 'Game ended successfully',
  PLAYER_JOINED: 'Player joined successfully',
  CHAT_MESSAGE_SENT: 'Chat message sent successfully'
};

// Validation Constants
const VALIDATION = {
  MIN_PLAYER_NAME_LENGTH: 2,
  MAX_PLAYER_NAME_LENGTH: 50,
  MAX_CHAT_MESSAGE_LENGTH: 500,
  UCI_MOVE_PATTERN: /^[a-h][1-8][a-h][1-8][qrbn]?$/,
  GAME_ID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// Time Constants (in milliseconds)
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

// Default Player Rating
const DEFAULT_RATING = 1200;

// Chess Board Constants
const BOARD = {
  SIZE: 8,
  FILES: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  RANKS: ['1', '2', '3', '4', '5', '6', '7', '8'],
  CENTER_SQUARES: ['d4', 'd5', 'e4', 'e5'],
  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
};

module.exports = {
  GAME_STATUS,
  COLORS,
  PIECE_VALUES,
  AI_DIFFICULTIES,
  SOCKET_EVENTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
  TIME,
  DEFAULT_RATING,
  BOARD
};
