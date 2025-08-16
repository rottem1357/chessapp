# Notifications Service

**Purpose**: Email/WebPush/Mobile push dispatch.

**APIs**:
- `POST /notify`
- `POST /devices/register`

**Integrations**: SES/SNS, FCM/APNs; topic fan-out.

**Testing**: Dedup/idempotency; backoff.

## Running

```bash
npm install
npm test
npm start
```
