# Tournament Service

**Purpose**: Swiss/Arena/KO orchestration.

**APIs**:
- `POST /tournaments`
- `POST /tournaments/:id/start`
- `GET /tournaments/:id/standings`

**Events**: `tournament.pairings`; calls Game to spawn.

**Data**: `tournaments`, `participants`, `pairings`, `results`.

**Testing**: Pairing correctness; 1000-player arena throughput.
