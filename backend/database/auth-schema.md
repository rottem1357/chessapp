# User Authentication Database Schema

## Table: users
- id (primary key, UUID)
- username (unique, varchar)
- email (unique, varchar)
- password_hash (varchar)
- created_at (timestamp)
- updated_at (timestamp)
- last_login (timestamp)
- is_active (boolean)

## Table: password_resets
- id (primary key, UUID)
- user_id (foreign key -> users.id)
- reset_token (varchar)
- expires_at (timestamp)
- used (boolean)

## Table: sessions (optional for advanced features)
- id (primary key, UUID)
- user_id (foreign key -> users.id)
- session_token (varchar)
- created_at (timestamp)
- expires_at (timestamp)

---
*Drafted July 13, 2025*
