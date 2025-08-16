# File/Media Service

**Purpose**: Avatars, PGN exports, analysis files.

**APIs**:
- `POST /files/sign` (S3 presign)
- `GET /files/:id` (authz)

**Data**: S3; metadata in Postgres.

**Testing**: Virus scan hooks (optional), signed URL expiry.
