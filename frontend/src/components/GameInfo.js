import React from 'react';
import './GameInfo.css';

const GameInfo = ({ playerColor, opponent, isMyTurn, gameStatus, winner }) => {
  const getStatusText = () => {
    if (gameStatus === 'active') {
      return isMyTurn ? 'Your turn' : `${opponent}'s turn`;
    } else if (gameStatus === 'checkmate') {
      return winner === playerColor ? 'You won!' : 'You lost!';
    } else if (gameStatus === 'draw') {
      return 'Draw!';
    } else if (gameStatus === 'resigned') {
      return winner === playerColor ? 'You won by resignation!' : 'You resigned';
    }
    return '';
  };

  return (
    <div className="game-info">
      <div className="players-info">
        <div className={`player-info ${playerColor === 'white' ? 'active' : ''}`}>
          <span className="player-name">You ({playerColor})</span>
          <span className="player-rating">1200</span>
        </div>
        
        <div className={`player-info ${playerColor === 'black' ? 'active' : ''}`}>
          <span className="player-name">{opponent} ({playerColor === 'white' ? 'black' : 'white'})</span>
          <span className="player-rating">1200</span>
        </div>
      </div>
      
      <div className="game-status">
        <span className={`status-text ${gameStatus !== 'active' ? 'game-over' : ''}`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default GameInfo;
