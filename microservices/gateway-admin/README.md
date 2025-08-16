# Gateway Admin / Config Service

**Purpose**: Feature flags, rate limits, service registry, JWKS rotation.

**APIs**:
- `GET /healthz|readyz`
- `PUT /flags/:key`
- `GET /registry`

**Data**: DynamoDB/PG; SSM Parameter Store.

**Testing**: Safe rollout (percentage flags), audit logs.
