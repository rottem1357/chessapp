import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socketService';
import { gameAPI } from '../../services/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import styles from './GameBoard.module.css';

const GameBoard = () => {
  const { gameId } = useParams();
  const { user, token } = useAuthStore();
  const { 
    currentGame, 
    currentFen, 
    playerColor, 
    currentTurn,
    whiteTimeRemaining,
    blackTimeRemaining,
    status,
    updateGameState,
    addMove,
    resetGame,
    setCurrentGame,
    setPlayerColor
  } = useGameStore();
  
  const [chess] = useState(new Chess());
  const [moveSquares, setMoveSquares] = useState({});

  useEffect(() => {
    console.log('🎮 GameBoard mounted with:', { 
      gameId, 
      currentGame: currentGame?.id, 
      currentFen, 
      playerColor, 
      status 
    });

    // Ensure socket connection (handles direct navigation to /game/:id)
    if (!socketService.isConnected && token) {
      console.log('🔌 Connecting socket from GameBoard...');
      socketService.connect(token);
    }

    // Join the game room
    if (gameId) {
      socketService.joinGame(gameId);
    }

    // Subscribe to socket move events to live-update both players
    socketService.onMoveMade(({ move, game }) => {
      try {
        if (game?.current_fen) {
          chess.load(game.current_fen);
        }
        // Use full mapping so current_fen -> currentFen and other fields update reliably
        if (game) {
          setCurrentGame(game);
          // Derive and set player's color if possible
          const meId = user?.id || user?.user_id || user?._id;
          let color = null;
          const me = game.players?.find(p => (p.user_id || p.id || p.userId) === meId);
          if (me?.color) color = me.color;
          if (!color && meId) {
            if (game.white_player_id === meId) color = 'white';
            if (game.black_player_id === meId) color = 'black';
          }
          if (color) setPlayerColor(color);
        }
        // Moves history and turn come from server via `game`; avoid local toggles
      } catch (e) {
        console.error('❌ Failed to apply socket move:', e);
      }
    });

    // If we don't have game data, try to load from localStorage
    if (!currentGame && gameId) {
      console.log('🔄 No game data, checking localStorage...');
      const storedGame = localStorage.getItem('current-game');
      if (storedGame) {
        try {
          const gameData = JSON.parse(storedGame);
          console.log('📦 Found stored game data:', gameData);
          
          // Set the game in the store using the full game object
          if (gameData.gameState) {
            console.log('🎯 Setting game state from stored data:', gameData.gameState);
            setCurrentGame(gameData.gameState);
            if (gameData.color) setPlayerColor(gameData.color);
            else {
              const meId = user?.id || user?.user_id || user?._id;
              let color = null;
              const me = gameData.gameState.players?.find(p => (p.user_id || p.id || p.userId) === meId);
              if (me?.color) color = me.color;
              if (!color && meId) {
                if (gameData.gameState.white_player_id === meId) color = 'white';
                if (gameData.gameState.black_player_id === meId) color = 'black';
              }
              if (color) setPlayerColor(color);
            }
          } else {
            console.log('🎯 Setting game data directly:', gameData);
            setCurrentGame(gameData);
            const meId = user?.id || user?.user_id || user?._id;
            let color = null;
            const me = gameData.players?.find(p => (p.user_id || p.id || p.userId) === meId);
            if (me?.color) color = me.color;
            if (!color && meId) {
              if (gameData.white_player_id === meId) color = 'white';
              if (gameData.black_player_id === meId) color = 'black';
            }
            if (color) setPlayerColor(color);
          }
          
          // Clear the stored data
          localStorage.removeItem('current-game');
        } catch (error) {
          console.error('❌ Error loading stored game data:', error);
        }
      }
      
      // Also hydrate from API in case localStorage is absent or stale
      (async () => {
        try {
          console.log('🌐 Fetching game state from API');
          const { data } = await gameAPI.getGame(gameId);
          const payload = data?.data || data; // handle envelope
          if (payload) {
            setCurrentGame(payload);
            // Set player's color from payload
            const meId = user?.id || user?.user_id || user?._id;
            let color = null;
            const me = payload.players?.find(p => (p.user_id || p.id || p.userId) === meId);
            if (me?.color) color = me.color;
            if (!color && meId) {
              if (payload.white_player_id === meId) color = 'white';
              if (payload.black_player_id === meId) color = 'black';
            }
            if (color) setPlayerColor(color);
            if (payload.current_fen) {
              chess.load(payload.current_fen);
              updateGameState({ current_fen: payload.current_fen });
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to hydrate game via API', e);
        }
      })();
    }

    // Listen for game updates
    socketService.onGameUpdate((data) => {
      console.log('Game update:', data);
      updateGameState(data);
      chess.load(data.current_fen);
    });

    // Remove legacy onMoveUpdate path; we rely on onMoveMade above that sends full game state

    // Listen for game end
    socketService.onGameEnd((data) => {
      console.log('Game ended:', data);
      updateGameState(data);
    });

    return () => {
      // Cleanup any listeners when unmounting
      if (socketService && socketService.socket) {
        socketService.socket.off('move-made');
      }
      socketService.removeAllListeners();
    };
  }, [gameId, updateGameState, addMove, chess, currentGame]);

  // Derive playerColor once game and user are known
  useEffect(() => {
    if (!playerColor && currentGame?.players && user) {
      const meId = user?.id || user?.user_id || user?._id;
      const me = currentGame.players.find(p => (p.user_id || p.id || p.userId) === meId);
      if (me?.color) {
        setPlayerColor(me.color);
      }
    }
  }, [playerColor, currentGame, user, setPlayerColor]);

  // Load the current position
  useEffect(() => {
    if (currentFen) {
      chess.load(currentFen);
    }
  }, [currentFen, chess]);

  const onDrop = (sourceSquare, targetSquare) => {
    console.log('🧪 onDrop attempt', { sourceSquare, targetSquare, currentTurn, playerColor, status });
    // Check if it's the player's turn
    if (currentTurn !== playerColor) {
      console.warn('⛔ Not your turn', { currentTurn, playerColor });
      return false;
    }

    // Check if the game is active
    if (status !== 'active') {
      return false;
    }

    try {
      // First try the move without promotion
      let moveObj = {
        from: sourceSquare,
        to: targetSquare
      };

      // Check if this is a pawn promotion move
      const piece = chess.get(sourceSquare);
      const isPromotion = piece?.type === 'p' && 
        ((piece.color === 'w' && targetSquare[1] === '8') || 
         (piece.color === 'b' && targetSquare[1] === '1'));

      if (isPromotion) {
        moveObj.promotion = 'q'; // Always promote to queen for simplicity
      }

      const move = chess.move(moveObj);

      if (move) {
        console.log('✅ Valid move made:', move);

        // Revert the move - apply when server confirms
        chess.undo();

        // Prefer socket; fallback to HTTP if socket unavailable
        if (socketService?.isConnected) {
          // Send SAN over socket for consistency with backend validation
          socketService.makeMove(gameId, move.san);
        } else {
          // HTTP fallback
          (async () => {
            try {
              await gameAPI.makeMove(gameId, { move: move.san });
              const { data } = await gameAPI.getGame(gameId);
              const payload = data?.data || data;
              if (payload?.current_fen) {
                chess.load(payload.current_fen);
                // Update the entire game state so turn/status/timers are correct
                updateGameState(payload);
              }
            } catch (e) {
              console.error('❌ HTTP move failed:', e);
            }
          })();
        }

        return true;
      }
    } catch (error) {
      console.log('Invalid move:', error);
    }
    
    return false;
  };

  // Listen for invalid-move and error events for diagnostics
  useEffect(() => {
    if (!socketService?.socket) return;
    const invalidHandler = (payload) => {
      console.warn('🚫 INVALID MOVE from server:', payload);
    };
    const errorHandler = (payload) => {
      console.error('🔥 SOCKET ERROR:', payload);
    };
    socketService.socket.on('invalid-move', invalidHandler);
    socketService.socket.on('error', errorHandler);
    return () => {
      socketService.socket.off('invalid-move', invalidHandler);
      socketService.socket.off('error', errorHandler);
    };
  }, [socketService?.socket]);

  // Ensure we join the game room so we get room-scoped updates
  useEffect(() => {
    if (socketService?.isConnected && gameId) {
      try {
        socketService.joinGame(gameId);
      } catch (e) {
        console.warn('⚠️ Failed to join game room', e);
      }
    }
  }, [socketService?.isConnected, gameId]);

  const handleResign = () => {
    if (!gameId) return;
    if (window.confirm('Are you sure you want to resign?')) {
      (async () => {
        try {
          await gameAPI.resignGame(gameId);
          console.log('🏳️ Resigned successfully');
          // Optionally navigate back to home after resign
          window.location.href = '/';
        } catch (e) {
          console.error('❌ Failed to resign:', e);
        }
      })();
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '--:--';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getOpponentTime = () => {
    const time = playerColor === 'white' ? blackTimeRemaining : whiteTimeRemaining;
    return time || 0;
  };

  const getPlayerTime = () => {
    const time = playerColor === 'white' ? whiteTimeRemaining : blackTimeRemaining;
    return time || 0;
  };

  if (!currentGame) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Loading game...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <div className={styles.gameInfo}>
          <Card>
            <div className={styles.playerInfo}>
              <div className={styles.opponent}>
                <span className={styles.playerName}>Opponent</span>
                <span className={styles.time}>{formatTime(getOpponentTime())}</span>
              </div>
              
              <div className={styles.gameStatus}>
                <span className={`${styles.turnIndicator} ${currentTurn === playerColor ? styles.yourTurn : ''}`}>
                  {currentTurn === playerColor ? 'Your Turn' : "Opponent's Turn"}
                </span>
                <span className={styles.gameType}>
                  Rapid • {currentGame.time_control}
                </span>
              </div>
              
              <div className={styles.player}>
                <span className={styles.playerName}>{user?.username} (You)</span>
                <span className={styles.time}>{formatTime(getPlayerTime())}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.boardContainer}>
          <Chessboard
            position={currentFen}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            customSquareStyles={moveSquares}
            boardWidth={400}
          />
        </div>

        <div className={styles.gameControls}>
          <Card title="Game Controls">
            <div className={styles.controls}>
              <Button variant="danger" onClick={handleResign}>
                Resign
              </Button>
              <Button variant="secondary" disabled>
                Draw Offer
              </Button>
            </div>
            
            <div className={styles.gameDetails}>
              <div className={styles.detail}>
                <span>Game Type:</span>
                <span>{currentGame.game_type}</span>
              </div>
              <div className={styles.detail}>
                <span>Time Control:</span>
                <span>{currentGame.time_control}</span>
              </div>
              <div className={styles.detail}>
                <span>Your Color:</span>
                <span style={{ textTransform: 'capitalize' }}>{playerColor}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
