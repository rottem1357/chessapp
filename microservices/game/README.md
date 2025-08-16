# Game Service (Realtime)

**Purpose**: Host live games; validate moves; manage clocks; emit updates.

**Sockets**:
- `game:join`
- `game:move{uci}`
- `game:state`
- `game:offer_draw`
- `game:resign`

**APIs**:
- `GET /games/:id` (light state)
- `POST /games/:id/admin/end`

**Events**: `move.appended`, `game.snapshot`, `game.finished`.

**Data**: In‑mem board; Redis snapshot `game:{id}:fen/clock`; ephemeral room membership.

**Scaling**: Socket.io + Redis adapter; sticky sessions via ALB; N× nodes.

**SLOs**: emit p95 <100ms intra‑region.

**Testing**: Race conditions, premove, reconnection, draw rules.
