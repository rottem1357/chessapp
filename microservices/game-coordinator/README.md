# Game Coordinator / Router

**Purpose**: Place new games on nodes; resolve `gameId→node`.

**APIs**:
- `POST /games` (internal)
- `GET /routing/:gameId`

**Data**: Redis `route:game:{id}={nodeId}`; `nodes:{id}:capacity`.

**Testing**: Node churn; capacity-aware placement.
