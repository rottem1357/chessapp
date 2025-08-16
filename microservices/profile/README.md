# User/Profile Service

**Purpose**: Profiles, avatars, preferences, friends/blocks.

**APIs**:
- `GET/PUT /profiles/:id`
- `GET /profiles/:id/stats`
- `POST /friends/:id`

**Data**: `profiles`, `friends(user_id, friend_id, status)`, `blocks`.

**Cache**: Redis by `profile:{id}`.

**Testing**: E2E with Auth; privacy rules.
