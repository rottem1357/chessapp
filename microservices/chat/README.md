# Chat & Presence Service

**Purpose**: In-game chat, lobby, DMs (basic), online status.

**Sockets/APIs**:
- `chat:send`
- `GET /chat/history`
- `GET /presence/:user`

**Data**: Redis presence `presence:{userId}` TTL; Postgres chat (TTL/retention policy).

**Testing**: Flood/rate-limit; moderation hooks.
