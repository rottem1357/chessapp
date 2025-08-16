# AI Move Service (Stockfish Pool)

**Purpose**: Non-blocking AI moves.

**APIs**: `POST /ai/move {fen, level, timeLeft}` → `{uci, thinkMs}`.

**Queue**: Redis/Bull or SQS; pool size = CPU cores.

**Testing**: Time caps, determinism per level.
