import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { gameAPI, matchmakingAPI } from '../services/api';
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
      // Check current queue status on mount (in case of refresh)
      (async () => {
        try {
          const { data } = await matchmakingAPI.getStatus();
          const status = data?.data || data; // backend uses envelope
          if (status?.inQueue) {
            joinQueueStore();
            setQueueMessage('In queue...');
          }
        } catch (e) {
          // Non-blocking if status fails
          console.debug('Queue status check skipped/failed');
        }
      })();
      
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
    
    (async () => {
      try {
        // Ensure socket is connected to receive realtime events
        socketService.connect(token);

        // Prefer HTTP API to join queue (per OpenAPI - snake_case fields)
        // Broaden rating_range to ensure players can match regardless of rating
        const preferences = { 
          game_type: 'rapid', 
          time_control: '10+0', 
          rating_range: { min: 0, max: 3000 }
        };
        console.log('📤 Joining queue via API with prefs:', preferences);
        await matchmakingAPI.joinQueue(preferences);

        joinQueueStore();
        setQueueMessage('Looking for opponent...');
      } catch (err) {
        console.error('Error joining queue:', err);
        const valMsg = (err.response?.data?.data?.errors && Array.isArray(err.response.data.data.errors)
          ? err.response.data.data.errors.map(e => e.message).join('; ')
          : undefined) || err.response?.data?.message;
        setError(valMsg || 'Failed to join queue. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleLeaveQueue = () => {
    (async () => {
      try {
        await matchmakingAPI.leaveQueue();
      } catch (e) {
        console.debug('Leave queue API failed, emitting socket fallback');
        socketService.leaveQueue();
      } finally {
        leaveQueueStore();
        setQueueMessage('Looking for opponent...');
      }
    })();
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
