import axios from 'axios';

// API Configuration - matching your backend structure
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('chess-auth');
    if (token) {
      const authData = JSON.parse(token);
      if (authData.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    console.error('Full error response:', error.response);
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('chess-auth');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth API - matching your test structure
export const authAPI = {
  // POST /api/auth/register
  register: (userData) => apiClient.post('/auth/register', {
    username: userData.username,
    email: userData.email,
    password: userData.password,
    display_name: userData.display_name || userData.username,
    country: userData.country || 'US'
  }),
  
  // POST /api/auth/login - supports username or email
  login: (credentials) => apiClient.post('/auth/login', {
    username: credentials.email || credentials.username, // Your backend accepts either
    password: credentials.password
  }),
  
  // GET /api/auth/me
  getProfile: () => apiClient.get('/auth/me'),
  
  logout: () => apiClient.post('/auth/logout'),
};

// Game API - matching your test endpoints
export const gameAPI = {
  // GET /api/games - with filtering and pagination
  getGames: (params = {}) => apiClient.get('/games', { params }),
  
  // GET /api/games/:gameId
  getGame: (gameId) => apiClient.get(`/games/${gameId}`),
  
  // GET /api/games/:gameId/moves
  getGameMoves: (gameId) => apiClient.get(`/games/${gameId}/moves`),
  
  // POST /api/games/:gameId/join
  joinGame: (gameId, password = null) => apiClient.post(`/games/${gameId}/join`, { password }),
  
  // POST /api/games/:gameId/moves
  makeMove: (gameId, moveData) => apiClient.post(`/games/${gameId}/moves`, {
    move: moveData.move,
    time_spent_ms: moveData.timeSpent || 0,
    promotion: moveData.promotion || null
  }),
  
  // POST /api/games/:gameId/resign
  resignGame: (gameId) => apiClient.post(`/games/${gameId}/resign`),
  
  // POST /api/games/:gameId/offer-draw
  offerDraw: (gameId) => apiClient.post(`/games/${gameId}/offer-draw`),
  
  // POST /api/games/:gameId/accept-draw
  acceptDraw: (gameId) => apiClient.post(`/games/${gameId}/accept-draw`),
};

// Friends API - from your tests structure
export const friendsAPI = {
  getFriends: () => apiClient.get('/friends'),
  sendFriendRequest: (userId) => apiClient.post('/friends/request', { userId }),
  acceptFriendRequest: (requestId) => apiClient.post(`/friends/accept/${requestId}`),
  declineFriendRequest: (requestId) => apiClient.post(`/friends/decline/${requestId}`),
};

export default apiClient;
