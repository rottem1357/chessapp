import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../hooks/useSocket';
import Chat from '../components/Chat';
import GameInfo from '../components/GameInfo';
import './Game.css';

const Game = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const socket = useSocket();
  
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState('start');
  const [playerColor, setPlayerColor] = useState('white');
  const [opponent, setOpponent] = useState('');
  const [gameStatus, setGameStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Display error and connection status (will be used in UI later)
  console.log('Connection Status:', connectionStatus);
  if (error) console.log('Game Error:', error);

  useEffect(() => {
    if (location.state) {
      setPlayerColor(location.state.color);
      setOpponent(location.state.opponent);
      if (location.state.fen) {
        const newGame = new Chess(location.state.fen);
        setGame(newGame);
        setGamePosition(location.state.fen);
        setIsMyTurn(newGame.turn() === (location.state.color === 'white' ? 'w' : 'b'));
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setError('');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setError('Connection lost. Attempting to reconnect...');
    });

    socket.on('move-made', (data) => {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setGamePosition(data.fen);
      setIsMyTurn(data.turn === (playerColor === 'white' ? 'w' : 'b'));
      setGameStatus(data.gameStatus);
      setWinner(data.winner);
      setError(''); // Clear any previous errors
    });

    socket.on('invalid-move', (data) => {
      console.error('Invalid move:', data.error);
      setError('Invalid move. Please try again.');
    });

    socket.on('game-ended', (data) => {
      setGameStatus('ended');
      setWinner(data.winner);
    });

    socket.on('opponent-disconnected', () => {
      setGameStatus('opponent-disconnected');
      setError('Your opponent has disconnected.');
    });

    socket.on('error', (data) => {
      setError(data.message || 'An error occurred');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('move-made');
      socket.off('invalid-move');
      socket.off('game-ended');
      socket.off('opponent-disconnected');
      socket.off('error');
    };
  }, [socket, playerColor]);

  const onDrop = (sourceSquare, targetSquare) => {
    if (!isMyTurn || gameStatus !== 'active') return false;

    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        socket.emit('make-move', {
          gameId: gameId,
          move: {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q'
          }
        });
        return true;
      }
    } catch (error) {
      console.error('Move error:', error);
    }

    return false;
  };

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign', { gameId });
    }
  };

  const getGameStatusMessage = () => {
    if (gameStatus === 'checkmate') {
      return `Checkmate! ${winner === playerColor ? 'You' : 'Opponent'} wins!`;
    } else if (gameStatus === 'draw') {
      return 'Game ended in a draw!';
    } else if (gameStatus === 'resigned') {
      return `${winner === playerColor ? 'You' : 'Opponent'} wins by resignation!`;
    } else if (gameStatus === 'opponent-disconnected') {
      return 'Opponent disconnected. You win!';
    }
    return '';
  };

  return (
    <div className="game-container">
      <div className="game-board-section">
        <GameInfo
          playerColor={playerColor}
          opponent={opponent}
          isMyTurn={isMyTurn}
          gameStatus={gameStatus}
          winner={winner}
        />
        
        <div className="chessboard-container">
          <Chessboard
            position={gamePosition}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            isDraggablePiece={({ piece }) => {
              return isMyTurn && 
                     gameStatus === 'active' && 
                     piece[0] === (playerColor === 'white' ? 'w' : 'b');
            }}
          />
        </div>

        {gameStatus !== 'active' && (
          <div className="game-over-message">
            <h3>{getGameStatusMessage()}</h3>
          </div>
        )}

        {gameStatus === 'active' && (
          <div className="game-controls">
            <button onClick={handleResign} className="resign-btn">
              Resign
            </button>
          </div>
        )}
      </div>

      <div className="game-sidebar">
        <Chat gameId={gameId} playerColor={playerColor} />
      </div>
    </div>
  );
};

export default Game;
