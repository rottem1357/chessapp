-- Initialize databases for different services
CREATE DATABASE auth_db;
CREATE DATABASE profiles_db;
CREATE DATABASE ratings_db;
CREATE DATABASE games_db;
CREATE DATABASE chat_db;

-- Create users for each service (in production, use separate credentials)
CREATE USER auth_user WITH ENCRYPTED PASSWORD 'auth_password';
CREATE USER profiles_user WITH ENCRYPTED PASSWORD 'profiles_password';
CREATE USER ratings_user WITH ENCRYPTED PASSWORD 'ratings_password';
CREATE USER games_user WITH ENCRYPTED PASSWORD 'games_password';
CREATE USER chat_user WITH ENCRYPTED PASSWORD 'chat_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE profiles_db TO profiles_user;
GRANT ALL PRIVILEGES ON DATABASE ratings_db TO ratings_user;
GRANT ALL PRIVILEGES ON DATABASE games_db TO games_user;
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
