# Gateway Admin / Config Service

This service manages feature flags, rate limits, service registry information and JWKS rotation for the platform.

## APIs
- `GET /healthz` – health check including current JWKS metadata
- `GET /readyz` – readiness check
- `PUT /flags/:key` – update a feature flag (`{ value: boolean, rollout?: number }`)
- `GET /registry` – list registered services

## Data
Currently data is stored in memory. Future versions will persist to DynamoDB/PG and use SSM Parameter Store.

## Testing
Safe rollout is supported with percentage flags. All updates are logged to STDOUT as a simple audit log.

## Development
```
npm install --prefix microservices/gateway-admin
npm start --prefix microservices/gateway-admin
```
