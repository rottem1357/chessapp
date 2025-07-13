import React, { useMemo } from 'react';
import { GAME_STATUS, PLAYER_COLORS } from '../utils/constants';
import { formatDuration, formatTimestamp } from '../utils/helpers';
import './GameInfo.css';

/**
 * GameInfo Component
 * @component
 * @description Displays comprehensive game information including players, status, and statistics.
 * @param {object} props
 * @param {string} props.playerColor - The color of the current player.
 * @param {string} props.opponent - The opponent's name.
 * @param {boolean} props.isMyTurn - Whether it's the current player's turn.
 * @param {string} props.gameStatus - The current game status.
 * @param {string} props.winner - The winner's color.
 * @param {number} props.gameStartTime - Timestamp when the game started.
 * @param {number} props.lastMoveTime - Timestamp of the last move.
 * @param {Array} props.moveHistory - Array of move objects.
 * @param {number} props.playerRating - Rating of the current player.
 * @param {number} props.opponentRating - Rating of the opponent.
 */
import PropTypes from 'prop-types';
const GameInfo = ({ 
  playerColor, 
  opponent, 
  isMyTurn, 
  gameStatus, 
  winner,
  gameStartTime,
  lastMoveTime,
  moveHistory = [],
  playerRating = 1200,
  opponentRating = 1200
}) => {
  // Calculate game statistics
  const gameStats = useMemo(() => {
    const currentTime = Date.now();
    const gameDuration = gameStartTime ? currentTime - gameStartTime : 0;
    const timeSinceLastMove = lastMoveTime ? currentTime - lastMoveTime : 0;
    // ...existing code...
    return {
      duration: gameDuration,
      timeSinceLastMove,
      totalMoves: moveHistory.length,
      playerMoves: moveHistory.filter(move => move.playerColor === playerColor).length,
      opponentMoves: moveHistory.filter(move => move.playerColor !== playerColor).length
    };
  }, [gameStartTime, lastMoveTime, moveHistory, playerColor]);

  // Get status text with enhanced messaging
  const getStatusText = useMemo(() => {
    switch (gameStatus) {
      case GAME_STATUS.ACTIVE:
        return isMyTurn ? 'Your turn' : `${opponent}'s turn`;
      case GAME_STATUS.CHECKMATE:
        return winner === playerColor ? 'You won by checkmate!' : 'You lost by checkmate!';
      case GAME_STATUS.STALEMATE:
        return 'Game ended in stalemate';
      case GAME_STATUS.DRAW:
        return 'Game ended in a draw';
      case GAME_STATUS.RESIGNED:
        return winner === playerColor ? 'You won by resignation!' : 'You resigned';
      case GAME_STATUS.OPPONENT_DISCONNECTED:
        return 'Opponent disconnected - You win!';
      case GAME_STATUS.WAITING:
        return 'Waiting for opponent...';
      default:
        return 'Game ended';
    }
  }, [gameStatus, isMyTurn, opponent, winner, playerColor]);

  // Get status indicator class
  const getStatusClass = useMemo(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) return 'game-over';
    return isMyTurn ? 'your-turn' : 'opponent-turn';
  }, [gameStatus, isMyTurn]);

  // Get opponent color
  const opponentColor = playerColor === PLAYER_COLORS.WHITE ? PLAYER_COLORS.BLACK : PLAYER_COLORS.WHITE;
  return (
    <div className="game-info">
      {/* Players Section */}
      <div className="players-section">
        <div className={`player-card ${playerColor === PLAYER_COLORS.WHITE ? 'white' : 'black'} ${isMyTurn ? 'active' : ''}`}>
          <div className="player-header">
            <div className="player-avatar">
              <span className="player-icon">464</span>
            </div>
            <div className="player-details">
              <span className="player-name">You</span>
              <span className="player-color">({playerColor})</span>
            </div>
          </div>
          <div className="player-stats">
            <span className="rating">Rating: {playerRating}</span>
            <span className="moves">Moves: {gameStats.playerMoves}</span>
          </div>
        </div>
        {/* VS Indicator */}
        <div className="vs-indicator">
          <span className="vs-text">VS</span>
        </div>

        <div className={`player-card ${opponentColor === PLAYER_COLORS.WHITE ? 'white' : 'black'} ${!isMyTurn && gameStatus === GAME_STATUS.ACTIVE ? 'active' : ''}`}>
          <div className="player-header">
            <div className="player-avatar">
              <span className="player-icon">🤖</span>
            </div>
            <div className="player-details">
              <span className="player-name">{opponent || 'Opponent'}</span>
              <span className="player-color">({opponentColor})</span>
            </div>
          </div>
          <div className="player-stats">
            <span className="rating">Rating: {opponentRating}</span>
            <span className="moves">Moves: {gameStats.opponentMoves}</span>
          </div>
        </div>
      </div>

      {/* Game Status Section */}
      <div className="status-section">
        <div className={`status-indicator ${getStatusClass}`}>
          <span className="status-text">{getStatusText}</span>
        </div>

        {gameStatus === GAME_STATUS.ACTIVE && (
          <div className="turn-timer">
            {gameStats.timeSinceLastMove > 0 && (
              <span className="time-since-move">
                {formatDuration(gameStats.timeSinceLastMove)} since last move
              </span>
            )}
          </div>
        )}
      </div>

      {/* Game Statistics */}
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Game Duration</span>
          <span className="stat-value">
            {gameStats.duration > 0 ? formatDuration(gameStats.duration) : '--'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Total Moves</span>
          <span className="stat-value">{gameStats.totalMoves}</span>
        </div>

        {gameStartTime && (
          <div className="stat-item">
            <span className="stat-label">Started</span>
            <span className="stat-value">
              {formatTimestamp(gameStartTime)}
            </span>
          </div>
        )}
      </div>

      {/* Game Controls Info */}
      {gameStatus === GAME_STATUS.ACTIVE && (
        <div className="controls-hint">
          <p className="hint-text">
            {isMyTurn ? 'Click and drag pieces to make your move' : 'Waiting for opponent\'s move...'}
          </p>
        </div>
      )}
    </div>
  );
};

GameInfo.propTypes = {
  playerColor: PropTypes.string.isRequired,
  opponent: PropTypes.string,
  isMyTurn: PropTypes.bool,
  gameStatus: PropTypes.string.isRequired,
  winner: PropTypes.string,
  gameStartTime: PropTypes.number,
  lastMoveTime: PropTypes.number,
  moveHistory: PropTypes.array,
  playerRating: PropTypes.number,
  opponentRating: PropTypes.number,
};

export default GameInfo;
