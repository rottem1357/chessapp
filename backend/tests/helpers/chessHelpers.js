const { Chess } = require('chess.js');

class ChessTestHelper {
  static createGameFromMoves(moves) {
    const chess = new Chess();
    
    for (const move of moves) {
      try {
        chess.move(move);
      } catch (error) {
        throw new Error(`Invalid move: ${move} in position: ${chess.fen()}`);
      }
    }
    
    return {
      fen: chess.fen(),
      pgn: chess.pgn(),
      history: chess.history(),
      isGameOver: chess.isGameOver(),
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw()
    };
  }

  static generateRandomGame(maxMoves = 30) {
    const chess = new Chess();
    const moves = [];
    
    while (!chess.isGameOver() && moves.length < maxMoves) {
      const possibleMoves = chess.moves();
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      chess.move(randomMove);
      moves.push(randomMove);
    }
    
    return this.createGameFromMoves(moves);
  }

  static validateFEN(fen) {
    try {
      const chess = new Chess(fen);
      return chess.fen() === fen;
    } catch {
      return false;
    }
  }

  static isValidMove(fen, move) {
    try {
      const chess = new Chess(fen);
      return chess.moves({ verbose: true }).some(m => 
        m.san === move || m.lan === move || m.uci === move
      );
    } catch {
      return false;
    }
  }

  static getGameResult(fen) {
    const chess = new Chess(fen);
    
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? 'black_wins' : 'white_wins';
    }
    
    if (chess.isStalemate() || chess.isDraw()) {
      return 'draw';
    }
    
    return null; // Game not finished
  }

  static createPuzzlePosition() {
    // Create a tactical position (simplified example)
    const positions = [
      'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4', // Scholar's mate threat
      'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 3', // Knight fork opportunity
      '8/8/8/8/8/8/6k1/4K2R w K - 0 1', // Back rank mate
      'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4' // Pin tactics
    ];
    
    return positions[Math.floor(Math.random() * positions.length)];
  }
}

module.exports = ChessTestHelper;
