import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import './Home.css';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('queue-joined', (data) => {
      setIsInQueue(true);
      setQueuePosition(data.position);
      setError('');
      setIsLoading(false);
    });

    socket.on('game-started', (data) => {
      setIsInQueue(false);
      setIsLoading(false);
      navigate(`/game/${data.gameId}`, { 
        state: { 
          gameId: data.gameId, 
          color: data.color, 
          opponent: data.opponent,
          fen: data.fen
        } 
      });
    });

    socket.on('error', (data) => {
      setError(data.message || 'An error occurred');
      setIsLoading(false);
      setIsInQueue(false);
    });

    return () => {
      socket.off('queue-joined');
      socket.off('game-started');
      socket.off('error');
    };
  }, [socket, navigate]);

  const handleJoinQueue = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!socket) {
      setError('Connection not established. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    
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
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
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
              disabled={!playerName.trim() || isLoading}
              className="join-queue-btn"
            >
              {isLoading ? 'Joining...' : 'Find Match'}
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

        <div className="game-modes">
          <h3>Game Modes</h3>
          <div className="mode-buttons">
            <Link to="/local" className="mode-btn local-mode">
              Play Local Game
            </Link>
          </div>
        </div>

        <div className="game-info">
          <h3>How to Play</h3>
          <ul>
            <li>Enter your name and click "Find Match" for online play</li>
            <li>Or click "Play Local Game" to practice locally</li>
            <li>Use drag and drop to move pieces</li>
            <li>Chat with your opponent during online games</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
