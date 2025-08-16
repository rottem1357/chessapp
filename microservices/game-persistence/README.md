# Game Persistence Service

**Purpose**: Durable storage of moves & results; archive.

**Inputs**: `move.appended`, `game.finished` (Kafka/Streams).

**Writes**: Postgres `games` (summary, indexes), Mongo/S3 `game_docs` (pgn/json).

**APIs**: `GET /archive/:gameId` (for export).

**Testing**: Idempotent writes; late events; partition strategy.
