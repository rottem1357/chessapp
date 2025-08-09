import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socketService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import styles from './GameBoard.module.css';

const GameBoard = () => {
  const { gameId } = useParams();
  const { user } = useAuthStore();
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

    // Join the game room
    if (gameId) {
      socketService.joinGame(gameId);
    }

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
            setPlayerColor(gameData.color);
          } else {
            console.log('🎯 Setting game data directly:', gameData);
            setCurrentGame(gameData);
          }
          
          // Clear the stored data
          localStorage.removeItem('current-game');
        } catch (error) {
          console.error('❌ Error loading stored game data:', error);
        }
      }
    }

    // Listen for game updates
    socketService.onGameUpdate((data) => {
      console.log('Game update:', data);
      updateGameState(data);
      chess.load(data.current_fen);
    });

    // Listen for move updates
    socketService.onMoveUpdate((data) => {
      console.log('📥 Move update received:', data);
      
      // Apply the move to our local chess instance
      try {
        const move = chess.move(data.move);
        console.log('✅ Applied move to local board:', move);
        
        addMove(data);
        updateGameState({ current_fen: chess.fen() });
        
        // Highlight the move using the move object properties
        if (data.move && data.move.from && data.move.to) {
          setMoveSquares({
            [data.move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            [data.move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
          });
          
          setTimeout(() => setMoveSquares({}), 1000);
        }
      } catch (error) {
        console.error('❌ Error applying move update:', error);
        // If move fails, sync with server state
        if (data.gameState && data.gameState.current_fen) {
          chess.load(data.gameState.current_fen);
          updateGameState({ current_fen: data.gameState.current_fen });
        }
      }
    });

    // Listen for game end
    socketService.onGameEnd((data) => {
      console.log('Game ended:', data);
      updateGameState(data);
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [gameId, updateGameState, addMove, chess, currentGame]);

  // Load the current position
  useEffect(() => {
    if (currentFen) {
      chess.load(currentFen);
    }
  }, [currentFen, chess]);

  const onDrop = (sourceSquare, targetSquare) => {
    // Check if it's the player's turn
    if (currentTurn !== playerColor) {
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
        
        // Revert the move - we'll apply it when server confirms
        chess.undo();
        
        // Send move to server
        socketService.makeMove(gameId, {
          from: sourceSquare,
          to: targetSquare,
          promotion: move.promotion
        });
        
        return true;
      }
    } catch (error) {
      console.log('Invalid move:', error);
    }
    
    return false;
  };

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      // Implement resign logic
      console.log('Player resigned');
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
