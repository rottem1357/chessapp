# Authentication API Specification

## Base Path: `/api/auth`

### 1. POST `/register`
- Registers a new user
- Request: `{ username, email, password }`
- Response: `201 Created` or error

### 2. POST `/login`
- Authenticates user and returns session/token
- Request: `{ username/email, password }`
- Response: `200 OK` + token/session info or error

### 3. POST `/logout`
- Logs out user (invalidates session/token)
- Request: `{ token }`
- Response: `200 OK`

### 4. POST `/password-reset/request`
- Initiates password reset
- Request: `{ email }`
- Response: `200 OK` or error

### 5. POST `/password-reset/confirm`
- Confirms password reset
- Request: `{ reset_token, new_password }`
- Response: `200 OK` or error

### 6. GET `/me`
- Returns current user profile (auth required)
- Request: Auth token in header
- Response: `200 OK` + user info

---
*Drafted July 13, 2025*
