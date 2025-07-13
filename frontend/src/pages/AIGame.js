import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import GameInfo from '../components/GameInfo';
import './AIGame.css';

const AIGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [chess] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(chess.fen());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [gameInfo, setGameInfo] = useState({
    turn: 'white',
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  });

  // Initialize or fetch game
  const fetchGameState = useCallback(async () => {
    try {
      console.log('Fetching game state for gameId:', gameId);
      setIsLoading(true);
      const response = await fetch(`/api/ai/game/${gameId}`);
      console.log('Fetch response status:', response.status);
      
      const data = await response.json();
      console.log('Fetch response data:', data);

      if (data.success) {
        setGame(data.game);
        chess.load(data.game.fen);
        setGamePosition(data.game.fen);
        setGameInfo({
          turn: data.game.turn,
          isCheck: data.game.isCheck,
          isCheckmate: data.game.isCheckmate,
          isStalemate: data.game.isStalemate,
          isDraw: data.game.isDraw
        });
      } else {
        setError(data.message || 'Failed to load game');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching game:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, chess]);

  useEffect(() => {
    if (gameId === 'new') {
      // This should be handled by the home page, but redirect just in case
      navigate('/');
    } else {
      fetchGameState();
    }
  }, [gameId, navigate, fetchGameState]);

  const makeMove = async (sourceSquare, targetSquare) => {
    try {
      // Validate it's player's turn
      if (!game || game.status === 'ended') {
        return false;
      }

      const currentTurn = chess.turn();
      const playerTurn = game.playerColor === 'white' ? 'w' : 'b';
      
      if (currentTurn !== playerTurn) {
        return false;
      }

      // Try to make the move locally first
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (!move) {
        return false;
      }

      // Update local state immediately
      setGamePosition(chess.fen());
      setLastMove({ from: sourceSquare, to: targetSquare });
      setIsThinking(true);

      // Send move to server
      const response = await fetch(`/api/ai/game/${gameId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          move: { from: sourceSquare, to: targetSquare }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update game state with server response
        chess.load(data.gameState.fen);
        setGamePosition(data.gameState.fen);
        setGameInfo({
          turn: data.gameState.turn,
          isCheck: data.gameState.isCheck,
          isCheckmate: data.gameState.isCheckmate,
          isStalemate: data.gameState.isStalemate,
          isDraw: data.gameState.isDraw
        });

        // Highlight AI move if available
        if (data.aiMove) {
          setLastMove({ from: data.aiMove.from, to: data.aiMove.to });
        }

        // Update game status
        if (data.gameState.isGameOver) {
          setGame(prev => ({ ...prev, status: 'ended' }));
        }
      } else {
        // Revert the move if server rejected it
        chess.undo();
        setGamePosition(chess.fen());
        setError(data.message || 'Invalid move');
      }
    } catch (err) {
      // Revert the move on error
      chess.undo();
      setGamePosition(chess.fen());
      setError('Failed to make move');
      console.error('Error making move:', err);
    } finally {
      setIsThinking(false);
    }

    return true;
  };

  const onPieceDrop = (sourceSquare, targetSquare) => {
    makeMove(sourceSquare, targetSquare);
    return true;
  };

  const newGame = () => {
    // Navigate back to home page where user can set up a new AI game
    navigate('/', { 
      state: { 
        showAISetup: true,
        previousDifficulty: game?.difficulty,
        previousColor: game?.playerColor
      } 
    });
  };

  const getCustomSquareStyles = () => {
    const styles = {};
    
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)'
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)'
      };
    }
    
    return styles;
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert'
    };
    return labels[difficulty] || difficulty;
  };

  if (isLoading) {
    return (
      <div className="ai-game-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-game-container">
        <div className="error">
          Error: {error}
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="ai-game-container">
        <div className="error">
          Game not found
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-game-container">
      <div className="game-header">
        <h2>Chess vs AI</h2>
        <div className="game-meta">
          <span className="difficulty">Difficulty: {getDifficultyLabel(game.difficulty)}</span>
          <span className="player-color">You play as: {game.playerColor}</span>
        </div>
      </div>

      <div className="game-content">
        <div className="board-container">
          <Chessboard
            position={gamePosition}
            onPieceDrop={onPieceDrop}
            boardOrientation={game.playerColor}
            customSquareStyles={getCustomSquareStyles()}
            areArrowsAllowed={false}
            animationDuration={200}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}
          />
          
          {isThinking && (
            <div className="thinking-indicator">
              <div className="thinking-spinner"></div>
              <span>AI is thinking...</span>
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <GameInfo
            gameInfo={gameInfo}
            players={[
              { name: 'You', color: game.playerColor },
              { name: `AI (${getDifficultyLabel(game.difficulty)})`, color: game.aiColor }
            ]}
            currentPlayer={gameInfo.turn === 'w' ? 'white' : 'black'}
          />

          <div className="game-controls">
            <button 
              className="btn btn-primary" 
              onClick={newGame}
            >
              New AI Game
            </button>
            
            {game.status === 'ended' && (
              <div className="game-result">
                {gameInfo.isCheckmate ? 
                  `${gameInfo.turn === 'w' ? 'Black' : 'White'} wins by checkmate!` :
                  gameInfo.isStalemate ? 'Game drawn by stalemate' :
                  gameInfo.isDraw ? 'Game drawn' : 'Game over'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGame;
