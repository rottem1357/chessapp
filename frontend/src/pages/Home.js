import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import './Home.css';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('queue-joined', (data) => {
      setIsInQueue(true);
      setQueuePosition(data.position);
    });

    socket.on('game-started', (data) => {
      setIsInQueue(false);
      navigate(`/game/${data.gameId}`, { 
        state: { 
          gameId: data.gameId, 
          color: data.color, 
          opponent: data.opponent,
          fen: data.fen
        } 
      });
    });

    return () => {
      socket.off('queue-joined');
      socket.off('game-started');
    };
  }, [socket, navigate]);

  const handleJoinQueue = () => {
    if (!playerName.trim()) return;
    
    socket.emit('join-queue', {
      name: playerName,
      rating: 1200
    });
  };

  const handleLeaveQueue = () => {
    setIsInQueue(false);
    setQueuePosition(0);
    // You might want to emit a leave-queue event to the server
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h2>Welcome to Chess App</h2>
        
        {!isInQueue ? (
          <div className="join-game-section">
            <div className="input-group">
              <label htmlFor="playerName">Enter your name:</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
              />
            </div>
            <button 
              onClick={handleJoinQueue}
              disabled={!playerName.trim()}
              className="join-queue-btn"
            >
              Find Match
            </button>
          </div>
        ) : (
          <div className="queue-section">
            <div className="queue-status">
              <h3>Looking for opponent...</h3>
              <p>Position in queue: {queuePosition}</p>
              <div className="loading-spinner"></div>
            </div>
            <button 
              onClick={handleLeaveQueue}
              className="leave-queue-btn"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="game-info">
          <h3>How to Play</h3>
          <ul>
            <li>Enter your name and click "Find Match"</li>
            <li>Wait for an opponent to join</li>
            <li>Play chess using standard rules</li>
            <li>Chat with your opponent during the game</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
