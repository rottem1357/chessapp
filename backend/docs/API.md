# Chess App Backend API Documentation

## Overview

The Chess App Backend provides RESTful APIs and WebSocket endpoints for chess gameplay, including multiplayer games and AI opponents.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently, the API does not require authentication. This may be added in future versions.

## Error Handling

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE" // Optional
}
```

## Success Responses

All successful API responses follow this format:

```json
{
  "success": true,
  "data": {}, // Response data
  "message": "Success message" // Optional
}
```

---

## REST API Endpoints

### Health Check

#### GET /health

Get server health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "uptime": 3600,
    "environment": "development"
  }
}
```

---

### Multiplayer Games

#### GET /games

Get list of active games.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "game-uuid",
        "status": "active",
        "players": 2,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "lastActivity": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### POST /games

Create a new multiplayer game.

**Request Body:**
```json
{
  "playerData": {
    "name": "Player Name",
    "rating": 1200
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "game-uuid",
    "status": "waiting",
    "players": 1,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### GET /games/:gameId

Get details of a specific game.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "game-uuid",
    "status": "active",
    "players": 2,
    "playersList": [
      {
        "id": "player-uuid",
        "name": "Player 1",
        "color": "white",
        "rating": 1200
      }
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "turn": "w",
    "moves": [],
    "isGameOver": false,
    "chatMessages": []
  }
}
```

#### POST /games/:gameId/join

Join an existing game.

**Request Body:**
```json
{
  "playerData": {
    "name": "Player Name",
    "rating": 1200
  }
}
```

#### POST /games/:gameId/leave

Leave a game.

**Request Body:**
```json
{
  "playerId": "player-uuid"
}
```

#### GET /stats

Get game statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGames": 150,
    "activeGames": 25,
    "waitingGames": 5,
    "waitingPlayers": 8,
    "maxGames": 1000
  }
}
```

---

### AI Games

#### GET /ai/difficulties

Get available AI difficulty levels.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": "beginner",
      "label": "Beginner",
      "depth": 1,
      "skillLevel": 1,
      "moveTime": 500,
      "description": "Random moves, good for absolute beginners"
    }
  ]
}
```

#### POST /ai/game/new

Create a new AI game.

**Request Body:**
```json
{
  "difficulty": "intermediate",
  "playerColor": "white",
  "playerId": "player-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "game-uuid",
    "difficulty": "intermediate",
    "playerColor": "white",
    "aiColor": "black",
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "turn": "w",
    "status": "active",
    "moves": []
  }
}
```

#### GET /ai/game/:gameId

Get AI game state.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "game-uuid",
    "difficulty": "intermediate",
    "playerColor": "white",
    "aiColor": "black",
    "fen": "current-position-fen",
    "turn": "w",
    "status": "active",
    "moves": [
      {
        "from": "e2",
        "to": "e4",
        "san": "e4",
        "player": "human",
        "timestamp": "2024-01-15T10:00:00.000Z"
      }
    ],
    "gameOver": false,
    "isCheck": false,
    "isCheckmate": false,
    "isStalemate": false,
    "isDraw": false
  }
}
```

#### POST /ai/game/:gameId/move

Make a move in AI game.

**Request Body:**
```json
{
  "move": "e4"  // SAN notation or move object
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playerMove": {
      "from": "e2",
      "to": "e4",
      "san": "e4"
    },
    "aiMove": {
      "from": "e7",
      "to": "e5",
      "san": "e5"
    },
    "gameState": {
      "fen": "updated-position-fen",
      "turn": "w",
      "isGameOver": false
    }
  }
}
```

#### POST /ai/game/:gameId/evaluate

Evaluate current position (placeholder for future implementation).

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 0,
    "advantage": "equal",
    "description": "Position evaluation not available in simple AI mode"
  }
}
```

#### DELETE /ai/game/:gameId

End AI game.

**Response:**
```json
{
  "success": true,
  "message": "Game ended successfully"
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket at: `ws://localhost:5000`

### Client → Server Events

#### join-queue

Join matchmaking queue for multiplayer games.

**Payload:**
```json
{
  "name": "Player Name",
  "rating": 1200
}
```

#### make-move

Make a move in a game.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "move": "e4"
}
```

#### chat-message

Send a chat message.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "message": "Good game!"
}
```

#### resign

Resign from a game.

**Payload:**
```json
{
  "gameId": "game-uuid"
}
```

#### request-draw

Request a draw.

**Payload:**
```json
{
  "gameId": "game-uuid"
}
```

#### respond-draw

Respond to a draw request.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "accepted": true
}
```

### Server → Client Events

#### queue-joined

Confirmation of joining matchmaking queue.

**Payload:**
```json
{
  "position": 3,
  "estimatedWaitTime": 45
}
```

#### game-started

Notification that a game has started.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "color": "white",
  "opponent": {
    "id": "player-uuid",
    "name": "Opponent Name"
  },
  "gameState": {}
}
```

#### move-made

Notification that a move was made.

**Payload:**
```json
{
  "move": {
    "from": "e2",
    "to": "e4",
    "san": "e4",
    "playerId": "player-uuid",
    "timestamp": "2024-01-15T10:00:00.000Z"
  },
  "gameState": {}
}
```

#### chat-message

Chat message received.

**Payload:**
```json
{
  "id": "message-uuid",
  "playerId": "player-uuid",
  "playerName": "Player Name",
  "message": "Good game!",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

#### game-ended

Notification that the game has ended.

**Payload:**
```json
{
  "reason": "checkmate", // "checkmate", "stalemate", "draw", "resignation", "timeout"
  "winner": "white", // or "black", or null for draw
  "gameState": {}
}
```

#### draw-offered

Draw offer received.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "fromPlayer": "player-uuid",
  "fromPlayerName": "Player Name"
}
```

#### draw-accepted / draw-declined

Draw offer response.

**Payload:**
```json
{
  "gameId": "game-uuid",
  "fromPlayer": "player-uuid"
}
```

#### opponent-disconnected

Opponent has disconnected.

**Payload:**
```json
{
  "gameId": "game-uuid"
}
```

#### invalid-move

Move was invalid.

**Payload:**
```json
{
  "success": false,
  "message": "Invalid move"
}
```

#### error

General error occurred.

**Payload:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `GAME_NOT_FOUND` | The specified game could not be found |
| `INVALID_MOVE` | The chess move is not valid |
| `NOT_YOUR_TURN` | It's not the player's turn to move |
| `GAME_ALREADY_OVER` | The game has already ended |
| `PLAYER_NOT_IN_GAME` | Player is not part of this game |
| `INVALID_GAME_STATE` | Game is in an invalid state |
| `AI_SERVICE_UNAVAILABLE` | AI service is currently unavailable |
| `INVALID_DIFFICULTY` | Invalid AI difficulty level |
| `CHAT_MESSAGE_TOO_LONG` | Chat message exceeds length limit |
| `INVALID_PLAYER_NAME` | Player name is invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

---

## Development

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Environment Variables

See `.env.example` for all available configuration options.

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```
