import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import DifficultySelector from '../components/DifficultySelector';
import { SOCKET_EVENTS, ERROR_MESSAGES, ROUTES } from '../utils/constants';
import { handleError, logError } from '../utils/errorHandler';
import { validatePlayerName, validateForm } from '../utils/validation';
import { debounce } from '../utils/helpers';
import './Home.css';

/**
 * Home Component
 * 
 * Main landing page for the chess application
 * Features:
 * - Game mode selection (Local, AI, Multiplayer)
 * - Player name input with validation
 * - Matchmaking queue management
 * - Enhanced error handling and accessibility
 * - Real-time connection status
 */
const Home = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Component state
  const [playerName, setPlayerName] = useState('');
  const [selectedGameMode, setSelectedGameMode] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [formErrors, setFormErrors] = useState({});
  const [gameStats] = useState(null);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Queue timer
  useEffect(() => {
    let timer;
    if (isInQueue) {
      timer = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInQueue]);

  // Socket connection status
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setConnectionStatus('connected');
      setError('');
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      if (isInQueue) {
        setIsInQueue(false);
        setQueueTime(0);
        setError(ERROR_MESSAGES.CONNECTION_LOST);
      }
    };

    const handleMatchFound = (data) => {
      try {
        setIsInQueue(false);
        setQueueTime(0);
        setError('');
        
        // Navigate to game with match data
        navigate(ROUTES.GAME.replace(':gameId', data.gameId), {
          state: {
            gameId: data.gameId,
            color: data.color,
            opponent: data.opponent,
            fen: data.fen
          }
        });
      } catch (err) {
        const handledError = handleError(err, 'Failed to join game');
        setError(handledError.message);
        logError(handledError);
      }
    };

    const handleQueueError = (data) => {
      setIsInQueue(false);
      setQueueTime(0);
      const errorMessage = data.message || ERROR_MESSAGES.QUEUE_ERROR;
      setError(errorMessage);
      logError(new Error(`Queue error: ${errorMessage}`));
    };

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on(SOCKET_EVENTS.QUEUE_ERROR, handleQueueError);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
      socket.off(SOCKET_EVENTS.QUEUE_ERROR, handleQueueError);
    };
  }, [socket, isInQueue, navigate]);

  // Debounced validation
  const debouncedValidation = useCallback(
    (name) => {
      const debouncedFn = debounce((name) => {
        const validation = validatePlayerName(name);
        setFormErrors(prev => ({
          ...prev,
          playerName: validation.isValid ? null : validation.error
        }));
      }, 300);
      debouncedFn(name);
    },
    []
  );

  // Handle player name change
  const handlePlayerNameChange = useCallback((e) => {
    const value = e.target.value;
    setPlayerName(value);
    debouncedValidation(value);
  }, [debouncedValidation]);

  // Handle game mode selection
  const handleGameModeSelect = useCallback((mode) => {
    setSelectedGameMode(mode);
    setError('');
  }, []);

  // Validate form before submission
  const validateGameForm = useCallback(() => {
    const validation = validateForm({
      playerName,
      gameMode: selectedGameMode,
      ...(selectedGameMode === 'ai' && { aiDifficulty })
    });

    setFormErrors(validation.errors);
    return validation.isValid;
  }, [playerName, selectedGameMode, aiDifficulty]);

  // Start local game
  const handleStartLocalGame = useCallback(() => {
    if (!validateGameForm()) return;

    try {
      setIsLoading(true);
      navigate(ROUTES.LOCAL_GAME, {
        state: { playerName }
      });
    } catch (err) {
      const handledError = handleError(err, 'Failed to start local game');
      setError(handledError.message);
      logError(handledError);
    } finally {
      setIsLoading(false);
    }
  }, [validateGameForm, navigate, playerName]);

  // Start AI game
  const handleStartAIGame = useCallback(async () => {
    if (!validateGameForm()) return;

    try {
      setIsLoading(true);
      
      // Create AI game via API
      const response = await fetch('/api/ai/game/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: aiDifficulty,
          playerColor: 'white', // Default to white, can be made configurable
          playerId: playerName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to AI game with the created game ID
        navigate(`/ai-game/${data.data.id}`, {
          state: { 
            playerName,
            difficulty: aiDifficulty 
          }
        });
      } else {
        throw new Error(data.message || 'Failed to create AI game');
      }
    } catch (err) {
      const handledError = handleError(err, 'Failed to start AI game');
      setError(handledError.message);
      logError(handledError);
    } finally {
      setIsLoading(false);
    }
  }, [validateGameForm, navigate, playerName, aiDifficulty]);

  // Start multiplayer matchmaking
  const handleStartMultiplayerGame = useCallback(() => {
    if (!validateGameForm()) return;

    if (connectionStatus !== 'connected') {
      setError(ERROR_MESSAGES.CONNECTION_REQUIRED);
      return;
    }

    try {
      setIsLoading(true);
      setQueueTime(0);
      
      socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {
        playerName: playerName.trim()
      });
      
      setIsInQueue(true);
      setError('');
    } catch (err) {
      const handledError = handleError(err, 'Failed to join matchmaking');
      setError(handledError.message);
      logError(handledError);
    } finally {
      setIsLoading(false);
    }
  }, [validateGameForm, connectionStatus, socket, playerName]);

  // Leave queue
  const handleLeaveQueue = useCallback(() => {
    try {
      if (socket) {
        socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
      }
      setIsInQueue(false);
      setQueueTime(0);
      setError('');
    } catch (err) {
      const handledError = handleError(err, 'Failed to leave queue');
      setError(handledError.message);
      logError(handledError);
    }
  }, [socket]);

  // Format queue time for display
  const formatQueueTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Get game mode button props
  const getGameModeButtonProps = useCallback((mode) => ({
    className: `game-mode-btn ${selectedGameMode === mode ? 'selected' : ''}`,
    onClick: () => handleGameModeSelect(mode),
    disabled: isLoading || isInQueue
  }), [selectedGameMode, isLoading, isInQueue, handleGameModeSelect]);

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Header Section */}
        <div className="home-header">
          <h1>Welcome to Chess</h1>
          <p className="home-subtitle">
            Choose your game mode and start playing!
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <div className="connection-status">
            <div className={`status-indicator ${connectionStatus}`}>
              {connectionStatus === 'connecting' && <div className="spinner" />}
              <span>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
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

        {/* Main Form */}
        <div className="home-form">
          {/* Player Name Input */}
          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="Enter your name"
              className={formErrors.playerName ? 'error' : ''}
              disabled={isLoading || isInQueue}
              maxLength={30}
              aria-describedby={formErrors.playerName ? 'playerName-error' : undefined}
            />
            {formErrors.playerName && (
              <span id="playerName-error" className="error-message">
                {formErrors.playerName}
              </span>
            )}
          </div>

          {/* Game Mode Selection */}
          <div className="form-group">
            <label>Game Mode</label>
            <div className="game-mode-grid">
              <button
                {...getGameModeButtonProps('local')}
                aria-describedby="local-mode-desc"
              >
                <div className="game-mode-icon">♟️</div>
                <div className="game-mode-text">
                  <h3>Local Game</h3>
                  <p>Play against a friend on the same device</p>
                </div>
              </button>

              <button
                {...getGameModeButtonProps('ai')}
                aria-describedby="ai-mode-desc"
              >
                <div className="game-mode-icon">🤖</div>
                <div className="game-mode-text">
                  <h3>AI Opponent</h3>
                  <p>Challenge the computer at various difficulty levels</p>
                </div>
              </button>

              <button
                {...getGameModeButtonProps('multiplayer')}
                aria-describedby="multiplayer-mode-desc"
                disabled={isLoading || isInQueue || connectionStatus !== 'connected'}
              >
                <div className="game-mode-icon">🌐</div>
                <div className="game-mode-text">
                  <h3>Online Multiplayer</h3>
                  <p>Play against other players online</p>
                </div>
              </button>
            </div>
            {formErrors.gameMode && (
              <span className="error-message">
                {formErrors.gameMode}
              </span>
            )}
          </div>

          {/* AI Difficulty Selection */}
          {selectedGameMode === 'ai' && (
            <div className="form-group">
              <DifficultySelector
                selectedDifficulty={aiDifficulty}
                onSelect={setAiDifficulty}
                disabled={isLoading || isInQueue}
              />
            </div>
          )}

          {/* Queue Status */}
          {isInQueue && (
            <div className="queue-status">
              <div className="queue-content">
                <div className="spinner" />
                <div className="queue-text">
                  <h3>Finding opponent...</h3>
                  <p>Queue time: {formatQueueTime(queueTime)}</p>
                </div>
              </div>
              <button
                onClick={handleLeaveQueue}
                className="btn-secondary"
              >
                Leave Queue
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {!isInQueue && (
            <div className="action-buttons">
              {selectedGameMode === 'local' && (
                <button
                  onClick={handleStartLocalGame}
                  disabled={isLoading || !playerName || formErrors.playerName}
                  className="btn-primary"
                >
                  {isLoading ? <div className="spinner" /> : null}
                  Start Local Game
                </button>
              )}

              {selectedGameMode === 'ai' && (
                <button
                  onClick={handleStartAIGame}
                  disabled={isLoading || !playerName || formErrors.playerName}
                  className="btn-primary"
                >
                  {isLoading ? <div className="spinner" /> : null}
                  Challenge AI
                </button>
              )}

              {selectedGameMode === 'multiplayer' && (
                <button
                  onClick={handleStartMultiplayerGame}
                  disabled={isLoading || !playerName || formErrors.playerName || connectionStatus !== 'connected'}
                  className="btn-primary"
                >
                  {isLoading ? <div className="spinner" /> : null}
                  Find Opponent
                </button>
              )}
            </div>
          )}
        </div>

        {/* Game Stats (if available) */}
        {gameStats && (
          <div className="game-stats">
            <h3>Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{gameStats.gamesPlayed}</span>
                <span className="stat-label">Games Played</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.wins}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.losses}</span>
                <span className="stat-label">Losses</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.draws}</span>
                <span className="stat-label">Draws</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
