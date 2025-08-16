# Rating Service

**Purpose**: Glicko-2 updates per pool.

**Inputs**: `game.finished`.

**APIs**:
- `GET /ratings/:userId`
- `POST /ratings/recalc` (admin)

**Data**: `ratings(user_id, pool, rating, rd, vol)`; `rating_history`.

**Testing**: Known cases; convergence for provisional users.
