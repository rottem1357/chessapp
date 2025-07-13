const express = require('express');
const { Chess } = require('chess.js');
const aiService = require('../services/stockfishService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Store active AI games
const aiGames = new Map();

/**
 * GET /api/ai/difficulties
 * Get available difficulty levels
 */
router.get('/difficulties', (req, res) => {
  try {
    const difficulties = aiService.getDifficultyLevels();
    res.json({
      success: true,
      difficulties
    });
  } catch (error) {
    console.error('Error getting difficulties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get difficulty levels'
    });
  }
});

/**
 * POST /api/ai/game/new
 * Create new AI game
 */
router.post('/game/new', async (req, res) => {
  try {
    console.log('Creating new AI game with body:', req.body);
    const { difficulty = 'intermediate', playerColor = 'white', playerId } = req.body;
    
    const gameId = uuidv4();
    const chess = new Chess();
    
    const game = {
      id: gameId,
      chess,
      difficulty,
      playerColor,
      playerId,
      aiColor: playerColor === 'white' ? 'black' : 'white',
      status: 'active',
      createdAt: new Date(),
      moves: []
    };
    
    console.log('Storing game with ID:', gameId);
    aiGames.set(gameId, game);
    console.log('Game stored. Current aiGames size:', aiGames.size);
    
    // If AI plays white, make first move
    let aiMove = null;
    if (game.aiColor === 'white') {
      try {
        const aiMoveUci = await aiService.generateMove(
          chess.fen(),
          difficulty,
          gameId
        );
        
        const moveObj = chess.move(aiMoveUci);
        if (moveObj) {
          aiMove = {
            from: moveObj.from,
            to: moveObj.to,
            san: moveObj.san,
            uci: aiMoveUci
          };
          game.moves.push(aiMove);
        }
      } catch (error) {
        console.error('Error generating AI opening move:', error);
      }
    }
    
    res.json({
      success: true,
      game: {
        id: gameId,
        difficulty,
        playerColor,
        aiColor: game.aiColor,
        fen: chess.fen(),
        turn: chess.turn(),
        status: chess.isGameOver() ? 'ended' : 'active',
        aiMove,
        moves: game.moves
      }
    });
  } catch (error) {
    console.error('Error creating AI game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI game'
    });
  }
});

/**
 * GET /api/ai/game/:gameId
 * Get current game state
 */
router.get('/game/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    console.log('Fetching game state for gameId:', gameId);
    const game = aiGames.get(gameId);
    
    if (!game) {
      console.log('Game not found:', gameId);
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    console.log('Game found, returning state');
    res.json({
      success: true,
      game: {
        id: gameId,
        difficulty: game.difficulty,
        playerColor: game.playerColor,
        aiColor: game.aiColor,
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        status: game.chess.isGameOver() ? 'ended' : 'active',
        moves: game.moves,
        gameOver: game.chess.isGameOver(),
        isCheck: game.chess.isCheck(),
        isCheckmate: game.chess.isCheckmate(),
        isStalemate: game.chess.isStalemate(),
        isDraw: game.chess.isDraw()
      }
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state'
    });
  }
});

/**
 * POST /api/ai/game/:gameId/move
 * Make player move and get AI response
 */
router.post('/game/:gameId/move', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { move } = req.body;
    
    const game = aiGames.get(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    if (game.chess.isGameOver()) {
      return res.status(400).json({
        success: false,
        message: 'Game is already over'
      });
    }
    
    // Validate it's player's turn
    const currentTurn = game.chess.turn();
    const playerTurn = game.playerColor === 'white' ? 'w' : 'b';
    
    if (currentTurn !== playerTurn) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn'
      });
    }
    
    // Make player move
    let playerMove;
    try {
      playerMove = game.chess.move(move);
      if (!playerMove) {
        return res.status(400).json({
          success: false,
          message: 'Invalid move'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid move format'
      });
    }
    
    game.moves.push({
      from: playerMove.from,
      to: playerMove.to,
      san: playerMove.san,
      player: 'human'
    });
    
    // Check if game is over after player move
    if (game.chess.isGameOver()) {
      const result = {
        success: true,
        playerMove: {
          from: playerMove.from,
          to: playerMove.to,
          san: playerMove.san
        },
        gameState: {
          fen: game.chess.fen(),
          turn: game.chess.turn(),
          isGameOver: true,
          isCheck: game.chess.isCheck(),
          isCheckmate: game.chess.isCheckmate(),
          isStalemate: game.chess.isStalemate(),
          isDraw: game.chess.isDraw()
        },
        moves: game.moves
      };
      
      return res.json(result);
    }
    
    // Generate AI response
    let aiMove = null;
    try {
      const aiMoveUci = await aiService.generateMove(
        game.chess.fen(),
        game.difficulty,
        gameId
      );
      
      const aiMoveObj = game.chess.move(aiMoveUci);
      if (aiMoveObj) {
        aiMove = {
          from: aiMoveObj.from,
          to: aiMoveObj.to,
          san: aiMoveObj.san,
          uci: aiMoveUci,
          player: 'ai'
        };
        game.moves.push(aiMove);
      }
    } catch (error) {
      console.error('Error generating AI move:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate AI move'
      });
    }
    
    const result = {
      success: true,
      playerMove: {
        from: playerMove.from,
        to: playerMove.to,
        san: playerMove.san
      },
      aiMove: aiMove ? {
        from: aiMove.from,
        to: aiMove.to,
        san: aiMove.san
      } : null,
      gameState: {
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        isGameOver: game.chess.isGameOver(),
        isCheck: game.chess.isCheck(),
        isCheckmate: game.chess.isCheckmate(),
        isStalemate: game.chess.isStalemate(),
        isDraw: game.chess.isDraw()
      },
      moves: game.moves
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error processing move:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process move'
    });
  }
});

/**
 * POST /api/ai/game/:gameId/evaluate
 * Evaluate current position
 */
router.post('/game/:gameId/evaluate', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = aiGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Position evaluation not implemented in simple AI
    // const evaluation = await aiService.evaluatePosition(
    //   game.chess.fen(),
    //   gameId
    // );
    
    res.json({
      success: true,
      evaluation: {
        score: 0,
        advantage: 'equal',
        description: 'Position evaluation not available in simple AI mode'
      }
    });
  } catch (error) {
    console.error('Error evaluating position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate position'
    });
  }
});

/**
 * DELETE /api/ai/game/:gameId
 * End AI game and cleanup
 */
router.delete('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (aiGames.has(gameId)) {
      aiGames.delete(gameId);
      
      // Cleanup AI game state
      // No engine cleanup needed for simple AI
      aiGames.delete(gameId);
      
      res.json({
        success: true,
        message: 'Game ended successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end game'
    });
  }
});

/**
 * Helper function to describe evaluation score
 */
function getEvaluationDescription(score) {
  const absScore = Math.abs(score);
  
  if (absScore >= 1000) return 'Decisive advantage';
  if (absScore >= 500) return 'Clear advantage';
  if (absScore >= 200) return 'Slight advantage';
  if (absScore >= 50) return 'Small advantage';
  return 'Equal position';
}

// Cleanup old games every 30 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [gameId, game] of aiGames) {
    if (now - game.createdAt.getTime() > maxAge) {
      aiGames.delete(gameId);
      // No engine cleanup needed for simple AI
    }
  }
}, 30 * 60 * 1000);

module.exports = router;
