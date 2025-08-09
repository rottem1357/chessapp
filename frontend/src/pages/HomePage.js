import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { gameAPI } from '../services/api';
import socketService from '../services/socketService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import styles from './HomePage.module.css';

const HomePage = () => {
  const { user, token, logout } = useAuthStore();
  const { 
    isInQueue, 
    queueStartTime,
    joinQueue: joinQueueStore, 
    leaveQueue: leaveQueueStore,
    setCurrentGame,
    setPlayerColor 
  } = useGameStore();
  
  const [queueTime, setQueueTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueMessage, setQueueMessage] = useState('Looking for opponent...');

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (token) {
      socketService.connect(token);
      
      // Listen for queue events
      socketService.onQueueJoined((data) => {
        console.log('🎯 Queue joined:', data);
        setQueueMessage(`In queue (position: ${data.position || 'unknown'})`);
        setLoading(false);
      });
      
      // Listen for match found (game started)
      socketService.onMatchFound((data) => {
        console.log('🎮 HomePage: Match found event triggered!', data);
        setCurrentGame(data.gameState || data);
        leaveQueueStore();
        // Navigate to game page - use gameId field from backend
        const gameId = data.gameId || data.id;
        console.log('🎯 Navigating to game:', gameId);
        window.location.href = `/game/${gameId}`;
      });
      
      console.log('📊 HomePage: Event listeners set up');

      // Listen for queue updates
      socketService.onQueueUpdate((data) => {
        console.log('📊 Queue update:', data);
        setQueueMessage(`In queue (${data.playersInQueue || 0} players waiting)`);
      });
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [token, setCurrentGame, leaveQueueStore]);

  // Update queue timer
  useEffect(() => {
    let interval;
    if (isInQueue && queueStartTime) {
      interval = setInterval(() => {
        setQueueTime(Math.floor((Date.now() - queueStartTime) / 1000));
      }, 1000);
    } else {
      setQueueTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInQueue, queueStartTime]);

  const handleJoinQueue = () => {
    if (!token) {
      setError('Please login first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Connect socket and join queue
      socketService.connect(token);
      
      // Send player data with the queue join request
      const playerData = {
        name: user?.username || 'Anonymous',
        rating: user?.rating || 1200,
        gameType: 'rapid'
      };
      
      console.log('📤 Sending player data:', playerData);
      socketService.joinQueue(playerData);
      joinQueueStore();
      setQueueMessage('Looking for opponent...');
    } catch (err) {
      console.error('Error joining queue:', err);
      setError('Failed to join queue. Please try again.');
      setLoading(false);
    }
  };

  const handleLeaveQueue = () => {
    socketService.leaveQueue();
    leaveQueueStore();
    setQueueMessage('Looking for opponent...');
  };

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    window.location.href = '/auth';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>♟️ Chess App</h1>
        <div className={styles.userInfo}>
          <span>Welcome, {user?.username}</span>
          <Button variant="ghost" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <Card title="Quick Play">
            {error && <div className={styles.error}>{error}</div>}
            
            {!isInQueue ? (
              <div className={styles.playSection}>
                <p>Jump into a quick game with another player</p>
                <Button 
                  onClick={handleJoinQueue} 
                  size="large"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Finding Game...' : '🎮 Find Game'}
                </Button>
              </div>
            ) : (
              <div className={styles.queueSection}>
                <div className={styles.queueStatus}>
                  <div className={styles.spinner}>⌛</div>
                  <h3>{queueMessage}</h3>
                  <p>Queue time: {formatTime(queueTime)}</p>
                </div>
                <Button variant="danger" onClick={handleLeaveQueue}>
                  Cancel Search
                </Button>
              </div>
            )}
          </Card>

          <div className={styles.statsGrid}>
            <Card title="Your Stats">
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Games Played</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>1200</span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            </Card>

            <Card title="Game Modes">
              <div className={styles.gameModes}>
                <div className={styles.gameMode}>
                  <span>🏃 Rapid (10 min)</span>
                  <span className={styles.comingSoon}>Active</span>
                </div>
                <div className={styles.gameMode}>
                  <span>⚡ Blitz (5 min)</span>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>
                <div className={styles.gameMode}>
                  <span>💨 Bullet (1 min)</span>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
