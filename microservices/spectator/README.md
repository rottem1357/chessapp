# Spectator/Playback Service

**Purpose**: Join mid-game; viewer counts; move backfill.

**APIs**:
- `GET /games/:id/state`
- `GET /games/:id/moves?since=n`

**Data**: Redis snapshot; recent move ringbuffer; counts per room.

**Testing**: 10k spectators on hot game; throttled count updates.
