import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import DifficultySelector from '../components/DifficultySelector';
import './Home.css';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [selectedColor, setSelectedColor] = useState('white');
  const [creatingAIGame, setCreatingAIGame] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  // Check if we should show AI setup from navigation state
  useEffect(() => {
    if (location.state?.showAISetup) {
      setShowAISetup(true);
      if (location.state.previousDifficulty) {
        setSelectedDifficulty(location.state.previousDifficulty);
      }
      if (location.state.previousColor) {
        setSelectedColor(location.state.previousColor);
      }
    }
  }, [location.state]);

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

  const handlePlayAI = () => {
    setShowAISetup(true);
  };

  const handleStartAIGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setCreatingAIGame(true);
    setError('');

    console.log('Starting AI game with:', {
      difficulty: selectedDifficulty,
      playerColor: selectedColor,
      playerId: playerName
    });

    try {
      const response = await fetch('/api/ai/game/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          playerColor: selectedColor,
          playerId: playerName
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        navigate(`/ai-game/${data.game.id}`, {
          state: {
            gameId: data.game.id,
            difficulty: selectedDifficulty,
            playerColor: selectedColor
          }
        });
      } else {
        setError(data.message || 'Failed to create AI game');
      }
    } catch (err) {
      console.error('Error creating AI game:', err);
      setError('Failed to connect to server');
    } finally {
      setCreatingAIGame(false);
    }
  };

  const handleCancelAISetup = () => {
    setShowAISetup(false);
    setError('');
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
        
        {showAISetup ? (
          <div className="ai-setup-section">
            <h3>Play Against AI</h3>
            
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

            <div className="color-selection">
              <h4>Choose your color:</h4>
              <div className="color-buttons">
                <button 
                  className={`color-btn ${selectedColor === 'white' ? 'selected' : ''}`}
                  onClick={() => setSelectedColor('white')}
                >
                  White
                </button>
                <button 
                  className={`color-btn ${selectedColor === 'black' ? 'selected' : ''}`}
                  onClick={() => setSelectedColor('black')}
                >
                  Black
                </button>
              </div>
            </div>

            <DifficultySelector
              selectedDifficulty={selectedDifficulty}
              onSelect={setSelectedDifficulty}
            />

            <div className="ai-setup-buttons">
              <button 
                onClick={handleStartAIGame}
                disabled={!playerName.trim() || creatingAIGame}
                className="start-ai-game-btn"
              >
                {creatingAIGame ? 'Creating Game...' : 'Start AI Game'}
              </button>
              <button 
                onClick={handleCancelAISetup}
                className="cancel-ai-setup-btn"
              >
                Back
              </button>
            </div>
          </div>
        ) : !isInQueue ? (
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

        {!showAISetup && (
          <div className="game-modes">
            <h3>Game Modes</h3>
            <div className="mode-buttons">
              <button 
                onClick={handlePlayAI}
                className="mode-btn ai-mode"
              >
                Play Against AI
              </button>
              <Link to="/local" className="mode-btn local-mode">
                Play Local Game
              </Link>
            </div>
          </div>
        )}

        {!showAISetup && (
          <div className="game-info">
            <h3>How to Play</h3>
            <ul>
              <li>Enter your name and click "Find Match" for online play</li>
              <li>Or click "Play Against AI" to challenge the computer</li>
              <li>Or click "Play Local Game" to practice locally</li>
              <li>Use drag and drop to move pieces</li>
              <li>Chat with your opponent during online games</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
