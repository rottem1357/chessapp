# Matchmaking Service

**Purpose**: Pair players by rating/time control, dynamic window, optional latency bias.

**APIs**:
- `POST /queue/join`
- `POST /queue/leave`
- `GET /queue/state` (debug)

**Events**: emits `match.found {p1,p2,mode,region?}`.

**Data**: Redis sorted sets `mm:{mode}` score=rating, value={playerId, ts}.

**SLOs**: avg <5s; p95 <12s.

**Testing**: Load w/ synthetic users; fairness (winprob ~50%).
