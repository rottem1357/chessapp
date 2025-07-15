# Chess App Backend API Specification

## Base Configuration
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **API Version**: `v1`

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
```
**Request Body:**
```json
{
  "username": "string (3-50 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "display_name": "string (optional, max 100 chars)",
  "country": "string (optional, 2-letter code)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "display_name": "string",
    "country": "string"
  }
}
```

### Login User
```
POST /auth/login
```
**Request Body:**
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "display_name": "string",
      "rating_rapid": 1200,
      "rating_blitz": 1200,
      "rating_bullet": 1200
    }
  }
}
```

### Logout User
```
POST /auth/logout
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get User Profile
```
GET /auth/me
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "display_name": "string",
    "avatar_url": "string",
    "country": "string",
    "bio": "string",
    "rating_rapid": 1200,
    "rating_blitz": 1200,
    "rating_bullet": 1200,
    "rating_puzzle": 1200,
    "games_played": 0,
    "games_won": 0,
    "games_lost": 0,
    "games_drawn": 0,
    "is_verified": false,
    "is_premium": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Request Password Reset
```
POST /auth/password-reset/request
```
**Request Body:**
```json
{
  "email": "string"
}
```

### Confirm Password Reset
```
POST /auth/password-reset/confirm
```
**Request Body:**
```json
{
  "reset_token": "string",
  "new_password": "string"
}
```

---

## 👤 User Management Endpoints

### Get Public User Profile
```
GET /users/:userId
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "country": "string",
    "bio": "string",
    "rating_rapid": 1200,
    "rating_blitz": 1200,
    "rating_bullet": 1200,
    "games_played": 0,
    "games_won": 0,
    "games_lost": 0,
    "games_drawn": 0,
    "is_verified": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Update User Profile
```
PUT /users/profile
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "display_name": "string (optional)",
  "bio": "string (optional, max 500 chars)",
  "country": "string (optional, 2-letter code)",
  "avatar_url": "string (optional, valid URL)"
}
```

### Search Users
```
GET /users/search?q=username&page=1&limit=10
```
**Query Parameters:**
- `q`: Search query (username/display_name)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

### Get User Statistics
```
GET /users/:userId/stats
```
**Response:**
```json
{
  "success": true,
  "data": {
    "games_played": 100,
    "games_won": 45,
    "games_lost": 35,
    "games_drawn": 20,
    "win_rate": 45.0,
    "rating_history": [
      {
        "rating_type": "rapid",
        "rating": 1400,
        "date": "2025-01-01T00:00:00Z"
      }
    ],
    "recent_games": []
  }
}
```

### Get User Preferences
```
GET /users/preferences
```
**Headers:** `Authorization: Bearer <token>`

### Update User Preferences
```
PUT /users/preferences
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "board_theme": "green|brown|blue|grey|wood|marble",
  "piece_set": "classic|modern|medieval|fantasy|minimalist",
  "sound_enabled": true,
  "move_sound": "standard|wood|futuristic|silent",
  "show_coordinates": true,
  "show_legal_moves": true,
  "auto_queen_promotion": false,
  "confirm_resignation": true,
  "enable_premoves": true,
  "timezone": "UTC",
  "language": "en"
}
```

---

## 🎮 Game Management Endpoints

### Get Active Games
```
GET /games?page=1&limit=10&game_type=rapid&status=active
```
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `game_type`: rapid|blitz|bullet|classical
- `status`: waiting|active|finished

### Create New Game
```
POST /games
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "game_type": "rapid|blitz|bullet|classical",
  "time_control": "10+0",
  "time_limit_seconds": 600,
  "increment_seconds": 0,
  "is_rated": true,
  "is_private": false,
  "password": "string (optional)",
  "preferred_color": "white|black|random"
}
```

### Get Game Details
```
GET /games/:gameId
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "game_type": "rapid",
    "time_control": "10+0",
    "status": "active",
    "result": null,
    "current_fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "current_turn": "white",
    "move_count": 0,
    "white_time_remaining": 600000,
    "black_time_remaining": 600000,
    "is_rated": true,
    "players": [
      {
        "id": "uuid",
        "color": "white",
        "user": {
          "id": "uuid",
          "username": "string",
          "display_name": "string",
          "rating_rapid": 1400
        }
      }
    ],
    "moves": [],
    "opening": null,
    "created_at": "2025-01-01T00:00:00Z",
    "started_at": null,
    "finished_at": null
  }
}
```

### Join Game
```
POST /games/:gameId/join
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "password": "string (optional, for private games)"
}
```

### Make Move
```
POST /games/:gameId/moves
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "move": "e4|e2e4|{from:'e2',to:'e4'}",
  "time_spent_ms": 5000,
  "promotion": "q (optional)"
}
```

### Get Move History
```
GET /games/:gameId/moves
```

### Resign Game
```
POST /games/:gameId/resign
```
**Headers:** `Authorization: Bearer <token>`

### Offer Draw
```
POST /games/:gameId/draw
```
**Headers:** `Authorization: Bearer <token>`

### Accept/Decline Draw
```
PUT /games/:gameId/draw
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "action": "accept|decline"
}
```

### Get Game Analysis
```
GET /games/:gameId/analysis
```

### Request Engine Analysis
```
POST /games/:gameId/analyze
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "depth": 15,
  "engine": "stockfish"
}
```

---

## 🤖 AI Game Endpoints

### Get AI Difficulties
```
GET /ai/difficulties
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "level": "beginner",
      "name": "Beginner",
      "estimated_rating": 800,
      "description": "Good for learning basics"
    },
    {
      "level": "intermediate",
      "name": "Intermediate", 
      "estimated_rating": 1400,
      "description": "Balanced challenge"
    }
  ]
}
```

### Create AI Game
```
POST /ai/games
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "difficulty": "beginner|easy|intermediate|hard|expert|master",
  "time_control": "10+0",
  "user_color": "white|black|random"
}
```

### Get AI Game State
```
GET /ai/games/:gameId
```

### Make Move vs AI
```
POST /ai/games/:gameId/moves
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "move": "e4",
  "time_spent_ms": 5000
}
```

### Get Move Hint
```
POST /ai/games/:gameId/hint
```
**Headers:** `Authorization: Bearer <token>`

### End AI Game
```
DELETE /ai/games/:gameId
```
**Headers:** `Authorization: Bearer <token>`

---

## 🔄 Matchmaking Endpoints

### Join Matchmaking Queue
```
POST /matchmaking/queue
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "game_type": "rapid|blitz|bullet",
  "time_control": "10+0",
  "rating_range": {
    "min": 1200,
    "max": 1600
  }
}
```

### Leave Matchmaking Queue
```
DELETE /matchmaking/queue
```
**Headers:** `Authorization: Bearer <token>`

### Get Queue Status
```
GET /matchmaking/status
```
**Headers:** `Authorization: Bearer <token>`

---

## 🧩 Puzzle Endpoints

### Get Random Puzzle
```
GET /puzzles/random?rating=1400&themes=fork,pin
```
**Query Parameters:**
- `rating`: Target puzzle rating
- `themes`: Comma-separated themes

### Get Puzzle by ID
```
GET /puzzles/:puzzleId
```

### Submit Puzzle Solution
```
POST /puzzles/:puzzleId/attempt
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "moves": ["Nf7", "Kh8", "Qh5"],
  "time_spent_ms": 15000
}
```

### Get Puzzle Categories
```
GET /puzzles/categories
```

### Get User Puzzle Stats
```
GET /users/puzzle-stats
```
**Headers:** `Authorization: Bearer <token>`

---

## 👥 Friends & Social Endpoints

### Get Friends List
```
GET /friends?status=accepted
```
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:**
- `status`: pending|accepted|declined

### Send Friend Request
```
POST /friends/requests
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "user_id": "uuid",
  "message": "string (optional)"
}
```

### Respond to Friend Request
```
PUT /friends/requests/:requestId
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "action": "accept|decline"
}
```

### Remove Friend
```
DELETE /friends/:friendId
```
**Headers:** `Authorization: Bearer <token>`

### Challenge Friend
```
POST /friends/:friendId/challenge
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "game_type": "rapid",
  "time_control": "10+0",
  "color": "white|black|random",
  "message": "string (optional)"
}
```

---

## 📊 Ratings & Statistics Endpoints

### Get Leaderboard
```
GET /ratings/leaderboard?type=rapid&page=1&limit=50
```
**Query Parameters:**
- `type`: rapid|blitz|bullet|puzzle
- `page`: Page number
- `limit`: Items per page

### Get User Rating History
```
GET /users/:userId/rating-history?type=rapid
```

### Get Global Statistics
```
GET /statistics/global
```

---

## 📚 Opening Database Endpoints

### Search Openings
```
GET /openings?search=sicilian&eco=B20
```
**Query Parameters:**
- `search`: Search by name
- `eco`: ECO code filter

### Get Opening Details
```
GET /openings/:openingId
```

### Get Game Opening
```
GET /games/:gameId/opening
```

---

## ⚙️ Admin Endpoints

### Get All Users (Admin)
```
GET /admin/users?page=1&limit=50
```
**Headers:** `Authorization: Bearer <admin_token>`

### Monitor Games (Admin)
```
GET /admin/games?status=active
```
**Headers:** `Authorization: Bearer <admin_token>`

### Get Reports (Admin)
```
GET /admin/reports
```
**Headers:** `Authorization: Bearer <admin_token>`

---

## 🔌 WebSocket Events

### Client → Server Events
- `join-room`: Join game room
- `make-move`: Make a chess move
- `chat-message`: Send chat message
- `join-queue`: Join matchmaking
- `leave-queue`: Leave matchmaking
- `resign`: Resign from game
- `offer-draw`: Offer draw
- `accept-draw`: Accept draw offer
- `decline-draw`: Decline draw offer

### Server → Client Events
- `room-joined`: Confirmed room join
- `game-updated`: Game state changed
- `move-made`: Move was made
- `chat-message`: Chat message received
- `game-started`: Game began
- `game-ended`: Game finished
- `opponent-connected`: Opponent joined
- `opponent-disconnected`: Opponent left
- `queue-updated`: Queue status changed
- `match-found`: Match found
- `draw-offered`: Draw offer received
- `error`: Error occurred

---

## 📋 Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔒 Error Codes

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `GAME_001`: Game not found
- `GAME_002`: Invalid move
- `GAME_003`: Not your turn
- `GAME_004`: Game already finished
- `USER_001`: User not found
- `USER_002`: Username already exists
- `VALIDATION_001`: Invalid input format
- `RATE_LIMIT_001`: Too many requests

---

## 📝 HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error