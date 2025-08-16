# Analysis Service

**Purpose**: Post-game evals, blunders, accuracy.

**APIs**:
- `POST /analysis/jobs {gameId}`
- `GET /analysis/:gameId`

**Data**: JSONB per move annotations; S3 for heavy artifacts.

**Testing**: Throughput under burst; partial results.

## Development

```bash
npm install
npm test
npm start
```
