# Fair-Play / Anti-Cheat Service

**Purpose**: Offline heuristics + engine match stats; flagging.

**Inputs**: recent finished games; user reports.

**Outputs**: `fairplay.flagged{userId, confidence}`.

## Endpoints
- `POST /analyze` – submit finished games with engine match percentages.
- `POST /report` – submit a user report.
- `GET /flagged` – retrieve users flagged for potential cheating.

## Architecture
Request -> logger -> routes -> validation -> controller -> service -> model

## Development
```
npm install
npm start
```

## Testing
```
npm test
```

**Testing**: Precision/recall on sample sets; appeal workflow.
