// microservices/analysis/database/connection.js
// Placeholder for PostgreSQL connection using JSONB per move annotations.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
