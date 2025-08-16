# Puzzle Service

**Purpose**: Puzzles, ratings, Rush sessions.

**APIs**:
- `GET /puzzles/next?userId`
- `POST /puzzle-rush/start|move|finish`
- `GET /leaderboards/puzzle-rush`

**Data**: `puzzles(id, fen, solution[], rating, themes[])`.

**Testing**: Anti-repeat; latency under 100ms for next puzzle.
