import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import Chat from '../components/Chat';
import GameInfo from '../components/GameInfo';
import { GAME_STATUS, SOCKET_EVENTS, ERROR_MESSAGES } from '../utils/constants';
import { handleError, logError } from '../utils/errorHandler';
import { validateChessMove } from '../utils/validation';
import { formatDuration } from '../utils/helpers';
import './Game.css';

/**
 * Game Component
 * @component
 * @description Handles multiplayer chess game interface with real-time synchronization.
 */
import PropTypes from 'prop-types';
const Game = () => {
Game.propTypes = {};
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Enhanced game state management
  const {
    gamePosition,
    makeMove,
    resetGame,
    isValidMove
  } = useGameState();
  
  // Component state
  const [playerColor, setPlayerColor] = useState('white');
  const [opponent, setOpponent] = useState('');
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.ACTIVE);
  const [winner, setWinner] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMoveTime, setLastMoveTime] = useState(null);

  // Initialize game state from location or props
  useEffect(() => {
    try {
      setIsLoading(true);
      
      if (location.state) {
        const { color, opponent: opponentName, fen } = location.state;
        
        setPlayerColor(color);
        setOpponent(opponentName);
        setGameStartTime(Date.now());
        
        if (fen) {
          const newGame = new Chess(fen);
          resetGame(newGame);
          setIsMyTurn(newGame.turn() === (color === 'white' ? 'w' : 'b'));
        }
      }
    } catch (err) {
      const error = handleError(err, 'Failed to initialize game');
      setError(error.message);
      logError(error);
    } finally {
      setIsLoading(false);
    }
  }, [location.state, resetGame]);

  // Clear errors after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Enhanced socket event handlers
  const handleConnect = useCallback(() => {
    setConnectionStatus('connected');
    setError('');
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setError(ERROR_MESSAGES.CONNECTION_LOST);
  }, []);

  const handleMoveData = useCallback((data) => {
    try {
      const newGame = new Chess(data.fen);
      resetGame(newGame);
      setIsMyTurn(data.turn === (playerColor === 'white' ? 'w' : 'b'));
      setGameStatus(data.gameStatus);
      setWinner(data.winner);
      setError('');
      setLastMoveTime(Date.now());
      
      // Add move to history
      if (data.move) {
        setMoveHistory(prev => [...prev, {
          ...data.move,
          timestamp: Date.now(),
          playerColor: data.turn === 'w' ? 'black' : 'white'
        }]);
      }
    } catch (err) {
      const error = handleError(err, 'Failed to process move');
      setError(error.message);
      logError(error);
    }
  }, [playerColor, resetGame]);

  const handleInvalidMove = useCallback((data) => {
    const errorMessage = data.error || ERROR_MESSAGES.INVALID_MOVE;
    setError(errorMessage);
    logError(new Error(`Invalid move: ${errorMessage}`));
  }, []);

  const handleGameEnd = useCallback((data) => {
    setGameStatus(GAME_STATUS.ENDED);
    setWinner(data.winner);
  }, []);

  const handleOpponentDisconnected = useCallback(() => {
    setGameStatus(GAME_STATUS.OPPONENT_DISCONNECTED);
    setError(ERROR_MESSAGES.OPPONENT_DISCONNECTED);
  }, []);

  const handleSocketError = useCallback((data) => {
    const errorMessage = data.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    setError(errorMessage);
    logError(new Error(`Socket error: ${errorMessage}`));
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.MOVE_MADE, handleMoveData);
    socket.on(SOCKET_EVENTS.INVALID_MOVE, handleInvalidMove);
    socket.on(SOCKET_EVENTS.GAME_ENDED, handleGameEnd);
    socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
    socket.on(SOCKET_EVENTS.ERROR, handleSocketError);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.MOVE_MADE, handleMoveData);
      socket.off(SOCKET_EVENTS.INVALID_MOVE, handleInvalidMove);
      socket.off(SOCKET_EVENTS.GAME_ENDED, handleGameEnd);
      socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
      socket.off(SOCKET_EVENTS.ERROR, handleSocketError);
    };
  }, [
    socket,
    handleConnect,
    handleDisconnect,
    handleMoveData,
    handleInvalidMove,
    handleGameEnd,
    handleOpponentDisconnected,
    handleSocketError
  ]);

  // Enhanced move handler with validation
  const onDrop = useCallback((sourceSquare, targetSquare) => {
    if (!isMyTurn || gameStatus !== GAME_STATUS.ACTIVE) {
      return false;
    }

    try {
      // Validate move before attempting
      const moveData = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      };

      if (!validateChessMove(moveData)) {
        setError(ERROR_MESSAGES.INVALID_MOVE);
        return false;
      }

      // Check if move is valid using game state
      if (!isValidMove(sourceSquare, targetSquare)) {
        setError(ERROR_MESSAGES.INVALID_MOVE);
        return false;
      }

      // Make the move locally first
      const result = makeMove(sourceSquare, targetSquare, 'q');
      
      if (result.success) {
        // Send move to server
        socket.emit(SOCKET_EVENTS.MAKE_MOVE, {
          gameId: gameId,
          move: moveData
        });
        return true;
      } else {
        setError(result.error || ERROR_MESSAGES.INVALID_MOVE);
        return false;
      }
    } catch (error) {
      const handledError = handleError(error, 'Failed to make move');
      setError(handledError.message);
      logError(handledError);
      return false;
    }
  }, [isMyTurn, gameStatus, isValidMove, makeMove, socket, gameId]);

  // Enhanced resign handler
  const handleResign = useCallback(() => {
    if (window.confirm('Are you sure you want to resign?')) {
      try {
        socket.emit(SOCKET_EVENTS.RESIGN, { gameId });
      } catch (error) {
        const handledError = handleError(error, 'Failed to resign');
        setError(handledError.message);
        logError(handledError);
      }
    }
  }, [socket, gameId]);

  // Draw offer handler
  const handleDrawOffer = useCallback(() => {
    if (window.confirm('Offer a draw to your opponent?')) {
      try {
        socket.emit(SOCKET_EVENTS.DRAW_OFFER, { gameId });
      } catch (error) {
        const handledError = handleError(error, 'Failed to offer draw');
        setError(handledError.message);
        logError(handledError);
      }
    }
  }, [socket, gameId]);

  // Navigation handler
  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Game status message generator
  const getGameStatusMessage = useCallback(() => {
    switch (gameStatus) {
      case GAME_STATUS.CHECKMATE:
        return `Checkmate! ${winner === playerColor ? 'You' : 'Opponent'} wins!`;
      case GAME_STATUS.DRAW:
        return 'Game ended in a draw!';
      case GAME_STATUS.STALEMATE:
        return 'Game ended in stalemate!';
      case GAME_STATUS.RESIGNED:
        return `${winner === playerColor ? 'You' : 'Opponent'} wins by resignation!`;
      case GAME_STATUS.OPPONENT_DISCONNECTED:
        return 'Opponent disconnected. You win!';
      case GAME_STATUS.TIMEOUT:
        return `${winner === playerColor ? 'You' : 'Opponent'} wins by timeout!`;
      default:
        return '';
    }
  }, [gameStatus, winner, playerColor]);

  // Loading state
  if (isLoading) {
    return (
      <div className="game-container">
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Connection Status Bar */}
      {connectionStatus !== 'connected' && (
        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connecting' && <div className="spinner" />}
            <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error" role="alert">
          <button 
            className="close-btn"
            onClick={() => setError('')}
            aria-label="Close error message"
          >
            ×
          </button>
          {error}
        </div>
      )}

      <div className="game-layout">
        {/* Game Board Section */}
        <div className="game-board-section">
          <GameInfo
            playerColor={playerColor}
            opponent={opponent}
            isMyTurn={isMyTurn}
            gameStatus={gameStatus}
            winner={winner}
            gameStartTime={gameStartTime}
            lastMoveTime={lastMoveTime}
            moveHistory={moveHistory}
          />
          
          <div className="chessboard-container">
            <Chessboard
              position={gamePosition}
              onPieceDrop={onDrop}
              boardOrientation={playerColor}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)'
              }}
              customDarkSquareStyle={{
                backgroundColor: '#769656'
              }}
              customLightSquareStyle={{
                backgroundColor: '#eeeed2'
              }}
              isDraggablePiece={({ piece }) => {
                return isMyTurn && 
                       gameStatus === GAME_STATUS.ACTIVE && 
                       piece[0] === (playerColor === 'white' ? 'w' : 'b');
              }}
              arePremovesAllowed={false}
              animationDuration={200}
            />
          </div>

          {/* Game Status Messages */}
          {gameStatus !== GAME_STATUS.ACTIVE && (
            <div className="game-over-section">
              <div className="game-over-message">
                <h3>{getGameStatusMessage()}</h3>
                {gameStartTime && (
                  <p className="game-duration">
                    Game duration: {formatDuration(Date.now() - gameStartTime)}
                  </p>
                )}
              </div>
              <div className="game-over-actions">
                <button 
                  onClick={handleBackToHome}
                  className="btn-primary"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {/* Active Game Controls */}
          {gameStatus === GAME_STATUS.ACTIVE && (
            <div className="game-controls">
              <div className="control-group">
                <button 
                  onClick={handleResign} 
                  className="btn-danger"
                  disabled={!isMyTurn}
                >
                  Resign
                </button>
                <button 
                  onClick={handleDrawOffer}
                  className="btn-secondary"
                  disabled={!isMyTurn}
                >
                  Offer Draw
                </button>
              </div>
              
              <div className="turn-indicator">
                <span className={`turn-status ${isMyTurn ? 'your-turn' : 'opponent-turn'}`}>
                  {isMyTurn ? 'Your turn' : `${opponent}'s turn`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Game Sidebar */}
        <div className="game-sidebar">
          <Chat 
            gameId={gameId} 
            playerColor={playerColor}
            opponent={opponent}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;
