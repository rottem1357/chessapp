# Chat & Presence Service

Provides lobby and direct message chat along with simple online presence tracking.

## Sockets & APIs
- `chat:send` – broadcast a chat message to a room
- `GET /chat/history` – retrieve last 50 messages for a room
- `GET /presence/:user` – check if a user is online

## Architecture
Follows the flow `request -> logger -> routes -> validation -> controller -> service -> model -> db` for both HTTP and Socket.IO interactions.

## Data
- Redis key `presence:{userId}` with configurable TTL
- PostgreSQL table `chat_messages` for message history

## Running
```
PORT=4000 REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://chat_user:chat_password@localhost:5432/chat_db npm start
```

## Notes
- Basic in-memory rate limiting is applied to chat sends
- Hooks for moderation and advanced rate limiting can be added
