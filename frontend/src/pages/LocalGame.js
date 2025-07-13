import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import './LocalGame.css';

/**
 * LocalGame Component
 * @component
 * @description Handles local chess game interface and logic.
 */
import PropTypes from 'prop-types';
const LocalGame = () => {
LocalGame.propTypes = {};
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState('start');
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameStatus, setGameStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const navigate = useNavigate();

  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move === null) return false;

      const newPosition = game.fen();
      setGamePosition(newPosition);
      setMoveHistory([...moveHistory, move]);
      setCurrentPlayer(game.turn() === 'w' ? 'white' : 'black');

      // Check for game end
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setGameStatus('checkmate');
          setWinner(game.turn() === 'w' ? 'black' : 'white');
        } else if (game.isDraw()) {
          setGameStatus('draw');
          setWinner('draw');
        }
      }

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition('start');
    setCurrentPlayer('white');
    setGameStatus('active');
    setWinner(null);
    setMoveHistory([]);
  };

  const getGameStatusMessage = () => {
    if (gameStatus === 'checkmate') {
      return `Checkmate! ${winner} wins!`;
    } else if (gameStatus === 'draw') {
      return 'Game is a draw!';
    } else if (game.isCheck()) {
      return `${currentPlayer} is in check!`;
    } else {
      return `${currentPlayer}'s turn`;
    }
  };

  return (
    <div className="local-game-container">
      <div className="game-header">
        <h2>Local Chess Game</h2>
        <button onClick={() => navigate('/')} className="back-btn">
          Back to Home
        </button>
      </div>
      
      <div className="game-content">
        <div className="game-board">
          <Chessboard
            position={gamePosition}
            onPieceDrop={onDrop}
            areaPrimaryColor="#f0d9b5"
            areaSecondaryColor="#b58863"
            isDraggablePiece={({ piece }) => {
              if (gameStatus !== 'active') return false;
              return (currentPlayer === 'white' && piece.search(/^w/) !== -1) ||
                     (currentPlayer === 'black' && piece.search(/^b/) !== -1);
            }}
          />
        </div>
        
        <div className="game-info">
          <div className="status-section">
            <h3>Game Status</h3>
            <p className={`status-message ${gameStatus}`}>
              {getGameStatusMessage()}
            </p>
          </div>
          
          <div className="controls-section">
            <button onClick={resetGame} className="reset-btn">
              New Game
            </button>
          </div>
          
          <div className="moves-section">
            <h4>Move History</h4>
            <div className="moves-list">
              {moveHistory.map((move, index) => (
                <span key={index} className="move">
                  {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move.san}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalGame;
