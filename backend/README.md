# Chess App Backend

A Node.js backend server for the Chess Application, providing real-time multiplayer chess games and AI opponents.

## 🚀 Features

- **Real-time Multiplayer**: WebSocket-based real-time chess games
- **AI Opponents**: Multiple difficulty levels for single-player games
- **Game Management**: Create, join, and manage chess games
- **Chat System**: In-game chat functionality
- **RESTful API**: Clean API endpoints for game operations

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Data models and schemas
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── validators/      # Input validation
├── docs/            # API documentation
├── tests/           # Test files
├── server.js        # Main application entry point
└── package.json     # Dependencies and scripts
```

## 🛠️ Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env` file

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

## 🔧 Configuration

Environment variables are configured in the `.env` file:

- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS
- `SOCKET_CORS_ORIGIN`: Socket.IO CORS origin
- `JWT_SECRET`: Secret for JWT tokens (future use)

## 📚 API Documentation

### Health Check
- `GET /api/health` - Server health status

### Games
- `GET /api/games` - Get list of active games
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game details
- `DELETE /api/games/:id` - End game

### AI Games
- `GET /api/ai/difficulties` - Get available AI difficulty levels
- `POST /api/ai/game/new` - Create new AI game
- `GET /api/ai/game/:gameId` - Get AI game state
- `POST /api/ai/game/:gameId/move` - Make move in AI game
- `POST /api/ai/game/:gameId/evaluate` - Evaluate position
- `DELETE /api/ai/game/:gameId` - End AI game

### WebSocket Events

#### Client → Server
- `join-queue` - Join matchmaking queue
- `make-move` - Make a move in game
- `chat-message` - Send chat message
- `resign` - Resign from game

#### Server → Client
- `queue-joined` - Confirmation of queue join
- `game-started` - Game has started
- `move-made` - Move was made
- `chat-message` - Chat message received
- `game-ended` - Game ended
- `opponent-disconnected` - Opponent disconnected
- `error` - Error occurred

## 🏗️ Architecture

### Services
- **GameService**: Manages game state and logic
- **MatchmakingService**: Handles player matching
- **AIService**: Provides AI opponent functionality
- **ChatService**: Manages in-game chat
- **ValidationService**: Input validation

### Controllers
- **GameController**: Game-related endpoints
- **AIController**: AI game endpoints
- **HealthController**: Health check endpoints

### Models
- **Game**: Chess game model
- **Player**: Player model
- **Move**: Chess move model
- **ChatMessage**: Chat message model

## 🔒 Security

- Input validation on all endpoints
- Rate limiting for API requests
- CORS configuration
- Environment variable protection
- Error handling without information leakage

## 🧪 Testing

Run tests with:
```bash
npm test
```

Test coverage:
```bash
npm run test:coverage
```

## 📈 Performance

- In-memory game state management
- Efficient chess move validation
- Automatic cleanup of old games
- Optimized AI algorithms

## 🐛 Debugging

Enable debug logging:
```bash
DEBUG=chess:* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
