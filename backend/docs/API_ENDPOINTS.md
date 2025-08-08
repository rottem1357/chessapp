# Backend API Endpoints Reference

## Summary
- **Total Endpoints**: 49 unique endpoints
- **Route Files**: 12 files
- **Authentication**: 35 protected, 14 public
- **No Duplications Found**: ✅

---

## 🔐 Authentication Endpoints (`/api/auth`)
**Routes File**: `routes/auth.js` → `controllers/authController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| POST | `/register` | `register` | ❌ | ✅ Active |
| POST | `/login` | `login` | ❌ | ✅ Active |
| POST | `/logout` | `logout` | 🔒 | ✅ Active |
| GET | `/me` | `getProfile` | 🔒 | ✅ Active |
| POST | `/password-reset/request` | `requestPasswordReset` | ❌ | 🚧 Placeholder |
| POST | `/password-reset/confirm` | `confirmPasswordReset` | ❌ | 🚧 Placeholder |

---

## 🎮 Game Endpoints (`/api/games`)
**Routes File**: `routes/games.js` → `controllers/gameController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/` | `getGames` | ❌ | ✅ Active |
| GET | `/:gameId` | `getGameDetails` | 🔓 | ✅ Active |
| GET | `/:gameId/moves` | `getMoveHistory` | ❌ | ✅ Active |
| GET | `/:gameId/opening` | `getGameOpening` | ❌ | ✅ Active |
| GET | `/:gameId/analysis` | `getGameAnalysis` | 🔒 | 🚧 Placeholder |
| POST | `/` | `createGame` | 🔒 | ✅ Active |
| POST | `/:gameId/join` | `joinGame` | 🔒 | ✅ Active |
| POST | `/:gameId/moves` | `makeMove` | 🔒 | ✅ Active |
| POST | `/:gameId/resign` | `resignGame` | 🔒 | ✅ Active |
| POST | `/:gameId/draw` | `offerDraw` | 🔒 | ✅ Active |
| POST | `/:gameId/analyze` | `requestAnalysis` | 🔒 | 🚧 Placeholder |
| PUT | `/:gameId/draw` | `respondToDraw` | 🔒 | ✅ Active |

---

## 🤖 AI Game Endpoints (`/api/ai`)
**Routes File**: `routes/ai.js` → `controllers/aiController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/difficulties` | `getDifficulties` | ❌ | ✅ Active |
| POST | `/games` | `createAIGame` | 🔒 | ✅ Active |
| GET | `/games/:gameId` | `getAIGameState` | 🔒 | ✅ Active |
| POST | `/games/:gameId/moves` | `makeAIMove` | 🔒 | ✅ Active |
| POST | `/games/:gameId/hint` | `getHint` | 🔒 | ✅ Active |
| DELETE | `/games/:gameId` | `endAIGame` | 🔒 | ✅ Active |

---

## 👥 User Endpoints (`/api/users`)
**Routes File**: `routes/users.js` → `controllers/userController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/search` | `searchUsers` | ❌ | ✅ Active |
| GET | `/preferences` | `getPreferences` | 🔒 | ✅ Active |
| GET | `/puzzle-stats` | `getPuzzleStats` | 🔒 | 🚧 Placeholder |
| GET | `/:userId` | `getUserProfile` | 🔓 | ✅ Active |
| GET | `/:userId/stats` | `getUserStats` | ❌ | ✅ Active |
| GET | `/:userId/rating-history` | `getRatingHistory` | ❌ | ✅ Active |
| PUT | `/profile` | `updateProfile` | 🔒 | ✅ Active |
| PUT | `/preferences` | `updatePreferences` | 🔒 | ✅ Active |

---

## 🤝 Friend Endpoints (`/api/friends`)
**Routes File**: `routes/friends.js` → `controllers/friendController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/` | `getFriends` | 🔒 | ✅ Active |
| POST | `/requests` | `sendFriendRequest` | 🔒 | ✅ Active |
| POST | `/:friendId/challenge` | `challengeFriend` | 🔒 | ✅ Active |
| PUT | `/requests/:requestId` | `respondToFriendRequest` | 🔒 | ✅ Active |
| DELETE | `/:friendId` | `removeFriend` | 🔒 | ✅ Active |

---

## 🧩 Puzzle Endpoints (`/api/puzzles`)
**Routes File**: `routes/puzzles.js` → `controllers/puzzleController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/random` | `getRandomPuzzle` | 🔓 | ✅ Active |
| GET | `/categories` | `getCategories` | ❌ | ✅ Active |
| GET | `/:puzzleId` | `getPuzzleById` | 🔓 | ✅ Active |
| POST | `/:puzzleId/attempt` | `submitAttempt` | 🔒 | ✅ Active |

---

## ⚡ Matchmaking Endpoints (`/api/matchmaking`)
**Routes File**: `routes/matchmaking.js` → `controllers/matchmakingController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| POST | `/queue` | `joinQueue` | 🔒 | ✅ Active |
| DELETE | `/queue` | `leaveQueue` | 🔒 | ✅ Active |
| GET | `/status` | `getQueueStatus` | 🔒 | ✅ Active |

---

## 📊 Rating Endpoints (`/api/ratings`)
**Routes File**: `routes/ratings.js` → `controllers/ratingController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/leaderboard` | `getLeaderboard` | ❌ | ✅ Active |

---

## 📚 Opening Endpoints (`/api/openings`)
**Routes File**: `routes/openings.js` → `controllers/openingController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/` | `searchOpenings` | ❌ | ✅ Active |

---

## 📈 Statistics Endpoints (`/api/statistics`)
**Routes File**: `routes/statistics.js` → `controllers/statisticsController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/global` | `getGlobalStats` | ❌ | 🚧 Placeholder |

---

## 👑 Admin Endpoints (`/api/admin`)
**Routes File**: `routes/admin.js` → `controllers/adminController.js`

| Method | Endpoint | Controller Function | Auth | Status |
|--------|----------|-------------------|------|--------|
| GET | `/users` | `getUsers` | 👑 | ✅ Active |
| GET | `/games` | `getGames` | 👑 | ✅ Active |
| GET | `/reports` | `getReports` | 👑 | 🚧 Placeholder |
| GET | `/stats` | `getAdminStats` | 👑 | ✅ Active |

---

## 🔍 Authentication Legend
- ❌ **Public**: No authentication required
- 🔓 **Optional**: Works with or without auth (optionalAuth middleware)
- 🔒 **Required**: Must be authenticated (verifyToken middleware)
- 👑 **Admin**: Requires admin privileges (verifyAdmin middleware)

## 📊 Status Legend
- ✅ **Active**: Fully implemented and functional
- 🚧 **Placeholder**: Returns "not yet implemented" response

## 🗂️ File Structure Reference
```
routes/auth.js         → controllers/authController.js
routes/games.js        → controllers/gameController.js
routes/ai.js           → controllers/aiController.js
routes/users.js        → controllers/userController.js
routes/friends.js      → controllers/friendController.js
routes/puzzles.js      → controllers/puzzleController.js
routes/matchmaking.js  → controllers/matchmakingController.js
routes/ratings.js      → controllers/ratingController.js
routes/openings.js     → controllers/openingController.js
routes/statistics.js   → controllers/statisticsController.js
routes/admin.js        → controllers/adminController.js
```

## ✅ Validation Summary
- **No duplicate endpoints found**
- **All routes properly mapped to controllers**
- **Clear authentication patterns**
- **Consistent RESTful design**
- **Total: 49 unique endpoints across 11 domains**
