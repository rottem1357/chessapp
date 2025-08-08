// utils/constants.js

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Game Status Constants
 */
const GAME_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
  ABORTED: 'aborted',
  ABANDONED: 'abandoned',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  DRAW: 'draw'
};

/**
 * Player Colors
 */
const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

/**
 * Socket Events
 */
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Queue events
  JOIN_QUEUE: 'join-queue',
  LEAVE_QUEUE: 'leave-queue',
  QUEUE_JOINED: 'queue-joined',
  QUEUE_LEFT: 'queue-left',
  QUEUE_UPDATE: 'queue-update',
  
  // Game events
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  GAME_UPDATED: 'game-updated',
  MAKE_MOVE: 'make-move',
  MOVE_MADE: 'move-made',
  INVALID_MOVE: 'invalid-move',
  
  // Player events
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  OPPONENT_CONNECTED: 'opponent-connected',
  OPPONENT_DISCONNECTED: 'opponent-disconnected',
  
  // Game actions
  RESIGN: 'resign',
  REQUEST_DRAW: 'request-draw',
  RESPOND_DRAW: 'respond-draw',
  DRAW_OFFERED: 'draw-offered',
  DRAW_ACCEPTED: 'draw-accepted',
  DRAW_DECLINED: 'draw-declined',
  
  // Chat events
  CHAT_MESSAGE: 'chat-message',
  CHAT_MESSAGE_RECEIVED: 'chat-message-received',
  
  // Error events
  ERROR: 'error',
  VALIDATION_ERROR: 'validation-error'
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient privileges',
  
  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists',
  EMAIL_NOT_FOUND: 'Email address not found',
  INVALID_PASSWORD: 'Invalid password',
  
  // Game errors
  GAME_NOT_FOUND: 'Game not found',
  GAME_FULL: 'Game is full',
  GAME_ALREADY_OVER: 'Game is already over',
  INVALID_GAME_STATE: 'Invalid game state',
  PLAYER_NOT_IN_GAME: 'Player is not in this game',
  NOT_YOUR_TURN: 'It is not your turn',
  INVALID_MOVE: 'Invalid move',
  GAME_NOT_ACTIVE: 'Game is not active',
  
  // General errors
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  CHAT_MESSAGE_TOO_LONG: 'Chat message is too long',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
};

/**
 * Success Messages
 */
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SENT: 'Password reset instructions sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  
  // Game
  GAME_CREATED: 'Game created successfully',
  GAME_JOINED: 'Joined game successfully',
  PLAYER_JOINED: 'Player joined game',
  MOVE_MADE: 'Move made successfully',
  GAME_ENDED: 'Game ended',
  
  // General
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully'
};

/**
 * Default Values
 */
const DEFAULTS = {
  RATING: 1200,
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  GAME_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MOVE_TIMEOUT: 5 * 60 * 1000,  // 5 minutes
  CHAT_MESSAGE_MAX_LENGTH: 500,
  PLAYER_NAME_MAX_LENGTH: 50
};

/**
 * Chess Piece Values (for AI evaluation)
 */
const PIECE_VALUES = {
  PAWN: 1,
  KNIGHT: 3,
  BISHOP: 3,
  ROOK: 5,
  QUEEN: 9,
  KING: 0
};

/**
 * Game Types
 */
const GAME_TYPES = {
  RAPID: 'rapid',
  BLITZ: 'blitz',
  BULLET: 'bullet',
  CLASSICAL: 'classical',
  CORRESPONDENCE: 'correspondence',
  AI: 'ai',
  PUZZLE: 'puzzle'
};

/**
 * AI Difficulty Levels
 */
const AI_DIFFICULTIES = {
  BEGINNER: 'beginner',
  EASY: 'easy',
  INTERMEDIATE: 'intermediate',
  HARD: 'hard',
  EXPERT: 'expert',
  MASTER: 'master'
};

/**
 * Puzzle Themes
 */
const PUZZLE_THEMES = {
  FORK: 'fork',
  PIN: 'pin',
  SKEWER: 'skewer',
  DISCOVERY: 'discovery',
  DEFLECTION: 'deflection',
  DECOY: 'decoy',
  SACRIFICE: 'sacrifice',
  MATE_IN_1: 'mate_in_1',
  MATE_IN_2: 'mate_in_2',
  MATE_IN_3: 'mate_in_3',
  MATE_IN_4: 'mate_in_4',
  ENDGAME: 'endgame',
  OPENING: 'opening',
  MIDDLEGAME: 'middlegame',
  TACTICS: 'tactics',
  STRATEGY: 'strategy'
};

/**
 * User Roles
 */
const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

/**
 * Rating Types
 */
const RATING_TYPES = {
  RAPID: 'rapid',
  BLITZ: 'blitz',
  BULLET: 'bullet',
  CLASSICAL: 'classical',
  PUZZLE: 'puzzle'
};

/**
 * Friend Request Status
 */
const FRIENDSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  BLOCKED: 'blocked'
};

/**
 * Board Squares (for validation)
 */
const BOARD_SQUARES = [
  'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
  'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
  'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8',
  'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'
];

module.exports = {
  HTTP_STATUS,
  GAME_STATUS,
  COLORS,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULTS,
  PIECE_VALUES,
  GAME_TYPES,
  AI_DIFFICULTIES,
  PUZZLE_THEMES,
  USER_ROLES,
  RATING_TYPES,
  FRIENDSHIP_STATUS,
  BOARD_SQUARES
};