import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    console.log('🔌 Connecting to socket:', SOCKET_URL);
    console.log('🎫 Using token:', token ? 'Present' : 'Missing');
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Log ALL events from server for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log('📡 Socket event received:', eventName, args);
      
      // Extra detailed logging for game-started events
      if (eventName === 'game-started') {
        console.log('🎮 GAME STARTED EVENT DETAILS:', {
          eventName,
          args,
          firstArg: args[0],
          gameId: args[0]?.gameId,
          id: args[0]?.id
        });
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.isConnected = true;
      
      // Set up critical game-started handler directly on connect
      this.socket.on('game-started', (data) => {
        console.log('🚀 DIRECT game-started handler triggered:', data);
        const gameId = data.gameId || data.id;
        if (gameId) {
          console.log('🎯 DIRECT navigation to game:', gameId);
          
          // Store game data in localStorage for the GameBoard to pick up
          localStorage.setItem('current-game', JSON.stringify(data));
          
          window.location.href = `/game/${gameId}`;
        }
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Matchmaking events - matching your backend
  joinQueue(playerData = { gameType: 'rapid' }) {
    if (this.socket) {
      console.log('🎯 Joining queue:', playerData);
      this.socket.emit('join-queue', playerData);
    }
  }

  leaveQueue() {
    if (this.socket) {
      console.log('🚪 Leaving queue');
      this.socket.emit('leave-queue');
    }
  }

  onQueueJoined(callback) {
    if (this.socket) {
      this.socket.on('queue-joined', callback);
    }
  }

  onMatchFound(callback) {
    if (this.socket) {
      console.log('🔗 Setting up game-started listener');
      this.socket.on('game-started', (data) => {
        console.log('🎮 onMatchFound callback triggered with data:', data);
        callback(data);
      });
    } else {
      console.warn('⚠️ Socket not available when setting up game-started listener');
    }
  }

  onQueueJoined(callback) {
    if (this.socket) {
      this.socket.on('queue-joined', callback);
    }
  }

  onQueueUpdate(callback) {
    if (this.socket) {
      this.socket.on('queue-update', callback);
    }
  }

  // Game events - matching your backend
  joinGame(gameId) {
    if (this.socket) {
      console.log('🎮 Joining game room:', gameId);
      this.socket.emit('join-game', { gameId });
    }
  }

  makeMove(gameId, moveData) {
    if (this.socket) {
      console.log('📤 Making move:', { gameId, moveData });
      this.socket.emit('make-move', {
        gameId,
        move: moveData
      });
    }
  }

  onGameUpdate(callback) {
    if (this.socket) {
      this.socket.on('game-updated', callback);
    }
  }

  onMoveUpdate(callback) {
    if (this.socket) {
      this.socket.on('move-made', callback);
    }
  }

  onMoveMade(callback) {
    if (this.socket) {
      this.socket.on('move-made', callback);
    }
  }

  onGameEnd(callback) {
    if (this.socket) {
      this.socket.on('game-ended', callback);
    }
  }

  onPlayerDisconnected(callback) {
    if (this.socket) {
      this.socket.on('player-disconnected', callback);
    }
  }

  onPlayerReconnected(callback) {
    if (this.socket) {
      this.socket.on('player-reconnected', callback);
    }
  }

  // Cleanup listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new SocketService();
export default socketService;
