# ChessApp Backend API Contract

This document defines the standardized API response envelope, pagination metadata, validation, and authentication conventions across the backend.

## Response Envelope
All controllers must use `formatResponse(success, data, message, errorCode, meta)` from `backend/utils/helpers.js`.

Envelope shape:
```json
{
  "success": boolean,
  "data": any | null,
  "message": string,
  "errorCode": string | null,
  "meta": {
    // optional; see pagination below
  },
  "timestamp": string // ISO 8601
}
```

## Pagination Metadata
For all paginated endpoints, include pagination under `meta.pagination` while preserving the existing data payload structure.

```json
{
  "success": true,
  "data": {
    // existing payload (unchanged)
    "items": [...],
    "pagination": { /* may exist for backward compatibility */ }
  },
  "message": "...",
  "errorCode": null,
  "meta": {
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number,
      "hasNext": boolean,
      "hasPrev": boolean
    }
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Notes:
- Controllers should pass `meta` as `{ pagination: result.pagination }` to `formatResponse`.
- Data shape is not changed to avoid breaking existing clients. Some endpoints may still contain `data.pagination` for backward compatibility.

## Endpoints Updated to Use meta.pagination
The following controller methods now include `meta.pagination`:

- `controllers/puzzleController.js`
  - `getUserHistory()`
  - `getPuzzlesByDifficulty()`
- `controllers/matchmakingController.js`
  - `getQueueHistory()`
- `controllers/gameController.js`
  - `getGames()`
- `controllers/openingController.js`
  - `searchOpenings()`
  - `getOpeningsByECO()`
- `controllers/adminController.js`
  - `getUsers()`
  - `getGames()`
- `controllers/ratingController.js`
  - `getLeaderboard()`
- `controllers/userController.js`
  - `searchUsers()`

## Validation & Authentication Conventions
- Use route-level validation from `backend/middleware/validation.js`.
  - Common: `validatePagination`, `validateUserSearch`, `validateUpdateProfile`, etc.
- Use `verifyToken` for authenticated routes.
- Use `verifyAdmin` for admin-only routes (e.g., `routes/matchmaking.js` → `/admin/queues`).
- Validate UUIDs for dynamic `:id` params using `validators.uuidParam()` from validation builders.

## Error Handling
- On error, respond with:
  - `success: false`
  - `data: null`
  - `message`: human-readable error
  - `errorCode`: stable code (e.g., `QUEUE_HISTORY_FAILED`, `VALIDATION_001`)
- Use appropriate HTTP status codes (400, 401, 403, 404, 500).

## Examples

Example: `GET /api/matchmaking/history?page=1&limit=20`
```json
{
  "success": true,
  "data": {
    "history": [/* ... */],
    "pagination": { "page": 1, "limit": 20, "total": 123, "pages": 7, "hasNext": true, "hasPrev": false }
  },
  "message": "Queue history retrieved successfully",
  "errorCode": null,
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 123, "pages": 7, "hasNext": true, "hasPrev": false }
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Example: `GET /api/users/search?q=alice&page=2&limit=10`
```json
{
  "success": true,
  "data": {
    "users": [/* ... */],
    "pagination": { "page": 2, "limit": 10, "total": 87, "pages": 9, "hasNext": true, "hasPrev": true }
  },
  "message": "Search completed successfully",
  "errorCode": null,
  "meta": {
    "pagination": { "page": 2, "limit": 10, "total": 87, "pages": 9, "hasNext": true, "hasPrev": true }
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Backward Compatibility
- Existing payloads remain unchanged. `data.pagination` may still be present in some endpoints to support current clients.
- New clients should rely on `meta.pagination` for pagination controls.

## Changelog (Contract Normalization)
- 2025-08-12: Added `meta.pagination` to the endpoints listed above. No breaking changes to `data` payloads.

## Developer Checklist for New Paginated Endpoints
- Build service to return `{ items|listName, pagination }`.
- In controller, wrap response with `formatResponse(true, result, message, null, { pagination: result.pagination })`.
- Add `validatePagination` (or equivalent) on the route.
- Ensure authentication/authorization middleware is applied where appropriate.
