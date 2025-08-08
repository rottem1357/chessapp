# API Testing Specification

## Overview
This document defines the expected input/output specifications for all backend endpoints to ensure comprehensive test coverage.

---

## 🔐 Authentication Endpoints (`/api/auth`)

### POST `/api/auth/register`
**Input:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (8+ chars, mix of letters/numbers/symbols)"
}
```
**Expected Output (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "token": "jwt_string"
  },
  "timestamp": "ISO_date"
}
```
**Expected Errors:**
- 400: Validation errors (username taken, invalid email, weak password)
- 409: User already exists

### POST `/api/auth/login`
**Input:**
```json
{
  "email": "string (valid email)",
  "password": "string"
}
```
**Expected Output (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "username": "string", "email": "string" },
    "token": "jwt_string"
  },
  "timestamp": "ISO_date"
}
```
**Expected Errors:**
- 400: Validation errors
- 401: Invalid credentials

### POST `/api/auth/logout`
**Headers:** `Authorization: Bearer <token>`
**Input:** None
**Expected Output:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null,
  "timestamp": "ISO_date"
}
```

### GET `/api/auth/me`
**Headers:** `Authorization: Bearer <token>`
**Expected Output:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "ISO_date"
  },
  "timestamp": "ISO_date"
}
```

---

## 🎮 Game Endpoints (`/api/games`)

### GET `/api/games`
**Query Parameters:**
```
?page=1&limit=10&game_type=rapid&status=active&is_rated=true
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Games retrieved successfully",
  "data": {
    "games": [
      {
        "id": "uuid",
        "game_type": "rapid|blitz|bullet|classical",
        "status": "waiting|active|finished",
        "is_rated": boolean,
        "time_control": "10+5",
        "players": [{"id": "uuid", "username": "string"}],
        "created_at": "ISO_date"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### POST `/api/games`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "game_type": "rapid|blitz|bullet|classical",
  "time_control": "10+5",
  "is_rated": true,
  "is_private": false,
  "password": "string (optional)"
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Game created successfully",
  "data": {
    "id": "uuid",
    "game_type": "rapid",
    "status": "waiting",
    "is_rated": true,
    "time_control": "10+5",
    "creator_id": "uuid",
    "created_at": "ISO_date"
  }
}
```

### GET `/api/games/:gameId`
**Path:** `gameId` (UUID)
**Expected Output:**
```json
{
  "success": true,
  "message": "Game details retrieved",
  "data": {
    "id": "uuid",
    "status": "active",
    "board": "fen_string",
    "players": [
      {"id": "uuid", "username": "string", "color": "white", "time_remaining": 600000}
    ],
    "current_turn": "white|black",
    "move_count": 15,
    "last_move": "e2e4",
    "created_at": "ISO_date"
  }
}
```

### POST `/api/games/:gameId/moves`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "move": "e2e4",
  "promotion": "q" // optional for pawn promotion
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Move made successfully",
  "data": {
    "move": "e2e4",
    "board": "new_fen_string",
    "current_turn": "black",
    "move_count": 16,
    "time_remaining": {"white": 580000, "black": 600000},
    "game_status": "active|check|checkmate|stalemate"
  }
}
```

---

## 🤖 AI Game Endpoints (`/api/ai`)

### GET `/api/ai/difficulties`
**Expected Output:**
```json
{
  "success": true,
  "message": "AI difficulties retrieved",
  "data": [
    {"level": 1, "name": "Beginner", "elo_range": "800-1000"},
    {"level": 2, "name": "Intermediate", "elo_range": "1200-1400"},
    {"level": 3, "name": "Advanced", "elo_range": "1600-1800"}
  ]
}
```

### POST `/api/ai/games`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "difficulty": 2,
  "game_type": "rapid",
  "time_control": "10+0",
  "player_color": "white|black|random"
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "AI game created successfully",
  "data": {
    "id": "uuid",
    "ai_difficulty": 2,
    "player_color": "white",
    "board": "starting_fen",
    "status": "active",
    "time_control": "10+0"
  }
}
```

---

## 👥 User Endpoints (`/api/users`)

### GET `/api/users/search`
**Query:** `?q=username&page=1&limit=10`
**Expected Output:**
```json
{
  "success": true,
  "message": "Users found",
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "string",
        "rating": 1500,
        "country": "US",
        "online": true
      }
    ],
    "pagination": {"page": 1, "limit": 10, "total": 5}
  }
}
```

### GET `/api/users/:userId`
**Expected Output:**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "id": "uuid",
    "username": "string",
    "rating": 1500,
    "games_played": 150,
    "wins": 75,
    "losses": 60,
    "draws": 15,
    "country": "US",
    "joined_at": "ISO_date"
  }
}
```

### PUT `/api/users/profile`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "display_name": "string (optional)",
  "country": "string (optional)",
  "bio": "string (optional, max 500 chars)"
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "country": "US",
    "bio": "string"
  }
}
```

---

## 🤝 Friend Endpoints (`/api/friends`)

### GET `/api/friends`
**Headers:** `Authorization: Bearer <token>`
**Expected Output:**
```json
{
  "success": true,
  "message": "Friends list retrieved",
  "data": {
    "friends": [
      {
        "id": "uuid",
        "username": "string",
        "rating": 1500,
        "online": true,
        "last_seen": "ISO_date"
      }
    ]
  }
}
```

### POST `/api/friends/requests`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "user_id": "uuid"
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Friend request sent",
  "data": {
    "request_id": "uuid",
    "to_user": {"id": "uuid", "username": "string"},
    "status": "pending"
  }
}
```

---

## 🧩 Puzzle Endpoints (`/api/puzzles`)

### GET `/api/puzzles/random`
**Query:** `?difficulty=intermediate&theme=tactics`
**Expected Output:**
```json
{
  "success": true,
  "message": "Random puzzle retrieved",
  "data": {
    "id": "uuid",
    "fen": "puzzle_position_fen",
    "moves": ["solution_moves"],
    "difficulty": "intermediate",
    "theme": "tactics",
    "rating": 1400
  }
}
```

### POST `/api/puzzles/:puzzleId/attempt`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "moves": ["e2e4", "d7d5"],
  "time_taken": 45000
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Puzzle attempt submitted",
  "data": {
    "correct": true,
    "rating_change": 10,
    "new_rating": 1410,
    "time_taken": 45000,
    "solution": ["correct_moves"]
  }
}
```

---

## ⚡ Matchmaking Endpoints (`/api/matchmaking`)

### POST `/api/matchmaking/queue`
**Headers:** `Authorization: Bearer <token>`
**Input:**
```json
{
  "game_type": "rapid",
  "time_control": "10+5",
  "rating_range": {"min": 1400, "max": 1600}
}
```
**Expected Output:**
```json
{
  "success": true,
  "message": "Joined matchmaking queue",
  "data": {
    "queue_id": "uuid",
    "position": 3,
    "estimated_wait": 30000,
    "preferences": {
      "game_type": "rapid",
      "time_control": "10+5"
    }
  }
}
```

### GET `/api/matchmaking/status`
**Headers:** `Authorization: Bearer <token>`
**Expected Output:**
```json
{
  "success": true,
  "message": "Queue status retrieved",
  "data": {
    "in_queue": true,
    "position": 2,
    "wait_time": 15000,
    "match_found": false
  }
}
```

---

## 📊 Rating Endpoints (`/api/ratings`)

### GET `/api/ratings/leaderboard`
**Query:** `?game_type=rapid&page=1&limit=50`
**Expected Output:**
```json
{
  "success": true,
  "message": "Leaderboard retrieved",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {"id": "uuid", "username": "string"},
        "rating": 2400,
        "games_played": 500,
        "country": "US"
      }
    ],
    "pagination": {"page": 1, "limit": 50, "total": 1000}
  }
}
```

---

## 📚 Opening Endpoints (`/api/openings`)

### GET `/api/openings`
**Query:** `?q=sicilian&page=1&limit=20`
**Expected Output:**
```json
{
  "success": true,
  "message": "Openings found",
  "data": {
    "openings": [
      {
        "id": "uuid",
        "name": "Sicilian Defense",
        "eco": "B20",
        "moves": "e2e4 c7c5",
        "popularity": 0.23
      }
    ],
    "pagination": {"page": 1, "limit": 20, "total": 5}
  }
}
```

---

## 👑 Admin Endpoints (`/api/admin`)

### GET `/api/admin/users`
**Headers:** `Authorization: Bearer <admin_token>`
**Query:** `?page=1&limit=50&sort=created_at&order=desc`
**Expected Output:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "rating": 1500,
        "games_played": 100,
        "banned": false,
        "created_at": "ISO_date"
      }
    ],
    "pagination": {"page": 1, "limit": 50, "total": 5000}
  }
}
```

---

## 🔍 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {"field": "email", "message": "Invalid email format"}
    ]
  },
  "errorCode": "VALIDATION_001",
  "timestamp": "ISO_date"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token",
  "data": null,
  "errorCode": "AUTH_001",
  "timestamp": "ISO_date"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin privileges required",
  "data": null,
  "errorCode": "AUTH_003",
  "timestamp": "ISO_date"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Game not found",
  "data": null,
  "errorCode": "GAME_NOT_FOUND",
  "timestamp": "ISO_date"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "errorCode": "INTERNAL_ERROR",
  "timestamp": "ISO_date"
}
```

---

## ✅ Test Requirements Checklist

For each endpoint, tests should verify:

### Input Validation Tests
- [ ] Valid input formats accepted
- [ ] Invalid input formats rejected (400 error)
- [ ] Required fields validation
- [ ] Optional fields handling
- [ ] Data type validation
- [ ] Length/range validation

### Authentication Tests  
- [ ] Protected endpoints reject unauthenticated requests (401)
- [ ] Valid tokens accepted
- [ ] Invalid/expired tokens rejected
- [ ] Admin endpoints require admin privileges (403)

### Business Logic Tests
- [ ] Successful operations return expected data structure
- [ ] Edge cases handled appropriately
- [ ] Database state changes verified
- [ ] Concurrent operations handled safely

### Error Handling Tests
- [ ] All error responses use consistent format
- [ ] Appropriate HTTP status codes
- [ ] Meaningful error messages
- [ ] Error codes match specification

### Response Format Tests
- [ ] All responses use unified `formatResponse()` structure
- [ ] Success responses include required fields
- [ ] Timestamps are valid ISO dates
- [ ] Pagination includes all required fields
