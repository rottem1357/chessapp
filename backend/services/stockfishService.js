const { Chess } = require('chess.js');

class SimpleAIService {
  constructor() {
    this.gameStates = new Map(); // Store game states
    this.maxEngines = 3; // Maximum concurrent games
    this.engineTimeout = 5000; // 5 seconds timeout for moves
  }

  /**
   * Generate AI move for given position using simple algorithms
   * @param {string} fen - Current position in FEN notation
   * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced, expert)
   * @param {string} gameId - Game identifier
   * @returns {Promise<string>} Best move in UCI format
   */
  async generateMove(fen, difficulty = 'intermediate', gameId = 'default') {
    try {
      const chess = new Chess(fen);
      const config = this.getDifficultyConfig(difficulty);
      
      // Simulate thinking time
      await this.sleep(config.moveTime);
      
      let bestMove;
      
      switch (difficulty) {
        case 'beginner':
          bestMove = this.getRandomMove(chess);
          break;
        case 'intermediate':
          bestMove = this.getBasicMove(chess);
          break;
        case 'advanced':
          bestMove = this.getTacticalMove(chess);
          break;
        case 'expert':
          bestMove = this.getStrategicMove(chess);
          break;
        default:
          bestMove = this.getBasicMove(chess);
      }
      
      return bestMove;
    } catch (error) {
      console.error('Error generating AI move:', error);
      throw error;
    }
  }

  /**
   * Sleep utility for simulating thinking time
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get random move (beginner level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Random move in UCI format
   */
  getRandomMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove.from + randomMove.to + (randomMove.promotion || '');
  }

  /**
   * Get basic move with simple evaluation (intermediate level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getBasicMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Prefer captures, then checks, then development
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      // Heavily favor captures
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
      }
      
      // Favor checks
      chess.move(move);
      if (chess.isCheck()) {
        score += 30;
      }
      chess.undo();
      
      // Favor center control
      if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
        score += 20;
      }
      
      // Favor piece development
      if (move.piece !== 'p' && ['a1', 'a8', 'h1', 'h8'].includes(move.from)) {
        score += 15;
      }
      
      // Add some randomness
      score += Math.random() * 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get tactical move (advanced level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getTacticalMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Look for tactical patterns
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      // Make the move to evaluate position
      chess.move(move);
      
      // Check for checkmate
      if (chess.isCheckmate()) {
        chess.undo();
        return move.from + move.to + (move.promotion || '');
      }
      
      // Heavy penalty for allowing checkmate
      const opponentMoves = chess.moves({ verbose: true });
      let allowsCheckmate = false;
      
      for (const opponentMove of opponentMoves) {
        chess.move(opponentMove);
        if (chess.isCheckmate()) {
          allowsCheckmate = true;
          chess.undo();
          break;
        }
        chess.undo();
      }
      
      if (allowsCheckmate) {
        score -= 1000;
      }
      
      // Check for checks
      if (chess.isCheck()) {
        score += 50;
      }
      
      // Evaluate captures
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
        
        // Bonus for capturing higher value pieces
        if (this.getPieceValue(move.captured) > this.getPieceValue(move.piece)) {
          score += 20;
        }
      }
      
      // Look for forks, pins, and skewers (simplified)
      score += this.evaluateTactics(chess);
      
      chess.undo();
      
      // Add small random element
      score += Math.random() * 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get strategic move (expert level)
   * @param {Chess} chess - Chess instance
   * @returns {string} Best move in UCI format
   */
  getStrategicMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Deep evaluation with strategic considerations
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      chess.move(move);
      
      // Checkmate detection
      if (chess.isCheckmate()) {
        chess.undo();
        return move.from + move.to + (move.promotion || '');
      }
      
      // Avoid allowing checkmate
      const opponentMoves = chess.moves({ verbose: true });
      let allowsCheckmate = false;
      
      for (const opponentMove of opponentMoves) {
        chess.move(opponentMove);
        if (chess.isCheckmate()) {
          allowsCheckmate = true;
          chess.undo();
          break;
        }
        chess.undo();
      }
      
      if (allowsCheckmate) {
        score -= 2000;
      }
      
      // Material evaluation
      if (move.captured) {
        score += this.getPieceValue(move.captured) * 10;
      }
      
      // Positional evaluation
      score += this.evaluatePosition(chess);
      
      // King safety
      score += this.evaluateKingSafety(chess);
      
      // Piece activity
      score += this.evaluatePieceActivity(chess);
      
      chess.undo();
      
      // Very small random element for variety
      score += Math.random() * 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  /**
   * Get piece value
   * @param {string} piece - Piece type
   * @returns {number} Piece value
   */
  getPieceValue(piece) {
    const values = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    return values[piece.toLowerCase()] || 0;
  }

  /**
   * Evaluate tactical patterns (simplified)
   * @param {Chess} chess - Chess instance
   * @returns {number} Tactical score
   */
  evaluateTactics(chess) {
    let score = 0;
    
    // Check for discovered attacks, pins, etc.
    // This is a simplified implementation
    const moves = chess.moves({ verbose: true });
    
    for (const move of moves) {
      chess.move(move);
      
      // Count opponent's attacked pieces
      const opponentMoves = chess.moves({ verbose: true });
      let attackedPieces = 0;
      
      for (const opponentMove of opponentMoves) {
        if (opponentMove.captured) {
          attackedPieces++;
        }
      }
      
      // Bonus for attacking multiple pieces (fork)
      if (attackedPieces > 1) {
        score += attackedPieces * 10;
      }
      
      chess.undo();
    }
    
    return score;
  }

  /**
   * Evaluate position (simplified)
   * @param {Chess} chess - Chess instance
   * @returns {number} Position score
   */
  evaluatePosition(chess) {
    let score = 0;
    
    // Center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    const board = chess.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const piece = board[i][j];
        
        if (piece) {
          // Center control bonus
          if (centerSquares.includes(square)) {
            score += piece.color === chess.turn() ? 10 : -10;
          }
          
          // Piece development bonus
          if (piece.type !== 'p' && piece.type !== 'k') {
            const isOnBackRank = (piece.color === 'w' && i === 7) || (piece.color === 'b' && i === 0);
            if (!isOnBackRank) {
              score += piece.color === chess.turn() ? 5 : -5;
            }
          }
        }
      }
    }
    
    return score;
  }

  /**
   * Evaluate king safety
   * @param {Chess} chess - Chess instance
   * @returns {number} King safety score
   */
  evaluateKingSafety(chess) {
    let score = 0;
    
    // Simplified king safety - avoid checks
    if (chess.isCheck()) {
      score -= 20;
    }
    
    // Bonus for castling
    if (chess.turn() === 'w') {
      if (!chess.getCastlingRights().w.k && !chess.getCastlingRights().w.q) {
        // Likely castled
        score += 15;
      }
    } else {
      if (!chess.getCastlingRights().b.k && !chess.getCastlingRights().b.q) {
        // Likely castled
        score += 15;
      }
    }
    
    return score;
  }

  /**
   * Evaluate piece activity
   * @param {Chess} chess - Chess instance
   * @returns {number} Piece activity score
   */
  evaluatePieceActivity(chess) {
    let score = 0;
    
    // Count available moves (mobility)
    const moves = chess.moves();
    score += moves.length * 2;
    
    // Penalty for opponent mobility
    const currentTurn = chess.turn();
    chess.turn = () => currentTurn === 'w' ? 'b' : 'w';
    const opponentMoves = chess.moves();
    chess.turn = () => currentTurn; // Restore
    
    score -= opponentMoves.length;
    
    return score;
  }

  /**
   * Evaluate position strength (simplified implementation)
   * @param {string} fen - Position in FEN notation
   * @param {string} gameId - Game identifier
   * @returns {Promise<number>} Evaluation score in centipawns
   */
  async evaluatePosition(fen, gameId = 'default') {
    try {
      const chess = new Chess(fen);
      let score = 0;
      
      // Material balance
      const board = chess.board();
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j];
          if (piece) {
            const value = this.getPieceValue(piece.type) * 100; // Convert to centipawns
            score += piece.color === 'w' ? value : -value;
          }
        }
      }
      
      // Positional factors
      score += this.evaluatePosition(chess);
      
      // King safety
      score += this.evaluateKingSafety(chess);
      
      // Piece activity
      score += this.evaluatePieceActivity(chess);
      
      return score;
    } catch (error) {
      console.error('Error evaluating position:', error);
      throw error;
    }
  }

  /**
   * Get difficulty configuration
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Configuration object
   */
  getDifficultyConfig(difficulty) {
    const configs = {
      beginner: {
        depth: 1,
        skillLevel: 1,
        moveTime: 500,
        description: 'Random moves, good for absolute beginners'
      },
      intermediate: {
        depth: 3,
        skillLevel: 10,
        moveTime: 1000,
        description: 'Basic tactics and piece development'
      },
      advanced: {
        depth: 5,
        skillLevel: 15,
        moveTime: 2000,
        description: 'Tactical patterns and strategic concepts'
      },
      expert: {
        depth: 7,
        skillLevel: 20,
        moveTime: 3000,
        description: 'Deep analysis with strategic understanding'
      }
    };

    return configs[difficulty] || configs.intermediate;
  }

  /**
   * Convert UCI move to SAN (Standard Algebraic Notation)
   * @param {string} uciMove - Move in UCI format (e.g., 'e2e4')
   * @param {string} fen - Current position FEN
   * @returns {string} Move in SAN format (e.g., 'e4')
   */
  uciToSan(uciMove, fen) {
    try {
      const chess = new Chess(fen);
      const move = chess.move(uciMove);
      return move ? move.san : uciMove;
    } catch (error) {
      console.error('Error converting UCI to SAN:', error);
      return uciMove;
    }
  }

  /**
   * Clean up game state
   * @param {string} gameId - Game identifier
   */
  async cleanupEngine(gameId) {
    if (this.gameStates.has(gameId)) {
      this.gameStates.delete(gameId);
    }
  }

  /**
   * Clean up all game states
   */
  async cleanup() {
    this.gameStates.clear();
  }

  /**
   * Get available difficulty levels
   * @returns {Array} Array of difficulty level objects
   */
  getDifficultyLevels() {
    return [
      { value: 'beginner', label: 'Beginner', ...this.getDifficultyConfig('beginner') },
      { value: 'intermediate', label: 'Intermediate', ...this.getDifficultyConfig('intermediate') },
      { value: 'advanced', label: 'Advanced', ...this.getDifficultyConfig('advanced') },
      { value: 'expert', label: 'Expert', ...this.getDifficultyConfig('expert') }
    ];
  }

  /**
   * Cleanup old games (called periodically)
   */
  cleanupOldGames() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [gameId, gameState] of this.gameStates) {
      if (now - gameState.lastUsed > maxAge) {
        this.gameStates.delete(gameId);
      }
    }
  }
}

// Create singleton instance
const aiService = new SimpleAIService();

// Cleanup old games every 30 minutes
setInterval(() => {
  aiService.cleanupOldGames();
}, 30 * 60 * 1000);

// Cleanup all games on process exit
process.on('exit', () => {
  aiService.cleanup();
});

process.on('SIGINT', () => {
  aiService.cleanup();
  process.exit(0);
});

module.exports = aiService;
